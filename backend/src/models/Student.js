const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'ap-south-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.STUDENTS_TABLE || 'Students';

const Student = {
    // INSERT Operation - Create new student
    async create(studentData) {
        // Check if registration number already exists (only if provided)
        if (studentData.registrationNo) {
            const existingStudent = await this.getByRegistrationNo(studentData.registrationNo);
            if (existingStudent) {
                throw new Error('Registration number already exists');
            }
        }
        
        const student = {
            id: uuidv4(),
            name: studentData.name,
            fathers_name: studentData.fathersName,
            registration_no: studentData.registrationNo,
            phone_no: studentData.phoneNo,
            course_name: studentData.courseName,
            batch_time: studentData.batchTime,
            course_duration: studentData.courseDuration || 6, // Default to 6 months if not specified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            fees: {
                monthly_amount: studentData.monthlyAmount || 0,
                status: 'pending',
                due_date: studentData.dueDate || (() => {
                    // If dueDate is not provided, calculate based on joining_date + 30 days
                    if (studentData.joining_date) {
                        console.log('Using joining date for due date calculation:', studentData.joining_date);
                        const joiningDate = new Date(studentData.joining_date);
                        const calculatedDueDate = new Date(joiningDate);
                        calculatedDueDate.setDate(calculatedDueDate.getDate() + 30);
                        return calculatedDueDate.toISOString();
                    }
                    // Fallback to current date + 30 days if no joining date
                    console.log('No joining date, using current date + 30 days');
                    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                })()
            }
        };
        
        const params = {
            TableName: TABLE_NAME,
            Item: student
        };
        
        try {
            await dynamodb.put(params).promise();
            return student;
        } catch (error) {
            throw new Error(`Error creating student: ${error.message}`);
        }
    },

    // SELECT Operations - Read students
    async findAll() {
        const params = {
            TableName: TABLE_NAME
        };
        
        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items;
        } catch (error) {
            throw new Error(`Error retrieving students: ${error.message}`);
        }
    },

    async findById(id) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id }
        };
        
        try {
            const result = await dynamodb.get(params).promise();
            return result.Item || null;
        } catch (error) {
            throw new Error(`Error retrieving student: ${error.message}`);
        }
    },

    async getByRegistrationNo(regNo) {
        // If registration number is not provided, return null
        if (!regNo) {
            return null;
        }
        
        // Check if the registration number is empty string
        if (regNo.trim() === '') {
            return null;
        }
        
        // Query using scan instead of index to avoid dependency on GSI
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: 'registration_no = :regNo',
            ExpressionAttributeValues: {
                ':regNo': regNo
            }
        };
        
        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items[0] || null;
        } catch (error) {
            throw new Error(`Error querying by registration: ${error.message}`);
        }
    },

    async getByCourse(courseName) {
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'CourseIndex',
            KeyConditionExpression: 'course_name = :course',
            ExpressionAttributeValues: {
                ':course': courseName
            }
        };
        
        try {
            const result = await dynamodb.query(params).promise();
            return result.Items;
        } catch (error) {
            throw new Error(`Error querying by course: ${error.message}`);
        }
    },

    // UPDATE Operations - Modify existing students
    async update(id, updateData) {
        // Build update expression dynamically
        let updateExpression = 'SET updated_at = :now';
        let expressionAttributeValues = {
            ':now': new Date().toISOString()
        };
        
        // Add fields to update
        if (updateData.name) {
            updateExpression += ', #name = :name';
            expressionAttributeValues[':name'] = updateData.name;
        }
        if (updateData.fathersName) {
            updateExpression += ', fathers_name = :fathers_name';
            expressionAttributeValues[':fathers_name'] = updateData.fathersName;
        }
        if (updateData.phoneNo) {
            updateExpression += ', phone_no = :phone_no';
            expressionAttributeValues[':phone_no'] = updateData.phoneNo;
        }
        if (updateData.courseName) {
            updateExpression += ', course_name = :course_name';
            expressionAttributeValues[':course_name'] = updateData.courseName;
        }
        if (updateData.batchTime) {
            updateExpression += ', batch_time = :batch_time';
            expressionAttributeValues[':batch_time'] = updateData.batchTime;
        }
        
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        
        // Handle reserved keyword 'name'
        if (updateData.name) {
            params.ExpressionAttributeNames = { '#name': 'name' };
        }
        
        try {
            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            throw new Error(`Error updating student: ${error.message}`);
        }
    },

    // UPDATE Fee Status
    async updateFeeStatus(id, status, paidDate = null) {
        let updateExpression = 'SET fees.#status = :status, updated_at = :now';
        let expressionAttributeValues = {
            ':status': status,
            ':now': new Date().toISOString()
        };
        
        if (paidDate) {
            updateExpression += ', fees.last_paid = :paid';
            expressionAttributeValues[':paid'] = paidDate;
        }
        
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        
        try {
            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            throw new Error(`Error updating fee status: ${error.message}`);
        }
    },

    // UPDATE Fee Amount
    async updateFeeAmount(id, amount) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET fees.monthly_amount = :amount, updated_at = :now',
            ExpressionAttributeValues: {
                ':amount': parseFloat(amount),
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        try {
            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            throw new Error(`Error updating fee amount: ${error.message}`);
        }
    },

    // UPDATE Fee Due Date
    async updateFeeDueDate(id, dueDate) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET fees.due_date = :due_date, updated_at = :now',
            ExpressionAttributeValues: {
                ':due_date': dueDate,
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        try {
            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            throw new Error(`Error updating due date: ${error.message}`);
        }
    },

    // SELECT students with due fees
    async getStudentsWithDueFees() {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: 'fees.#status <> :paidStatus',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':paidStatus': 'paid'
            }
        };
        
        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items;
        } catch (error) {
            throw new Error(`Error getting due fees: ${error.message}`);
        }
    },

    // DELETE Operation (bonus)
    async delete(id) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id }
        };
        
        try {
            await dynamodb.delete(params).promise();
            return true;
        } catch (error) {
            throw new Error(`Error deleting student: ${error.message}`);
        }
    }
};

module.exports = Student;