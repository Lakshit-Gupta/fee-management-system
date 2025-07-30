const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

class Fee extends Model {}

Fee.init({
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('paid', 'due'),
        defaultValue: 'due'
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Students',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Fee'
});

module.exports = Fee;