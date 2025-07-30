# AIICT Fee Management System

A comprehensive fee management system for AIICT, featuring SMS notifications, admin panel, and student fee tracking.

## Overview

The AIICT Fee Management System is designed to streamline fee collection and management for educational institutes. It provides automated fee reminders via SMS, a user-friendly admin panel, and comprehensive student record management.

## Features

- **Automated Fee Reminders**: Schedule SMS notifications for upcoming fee payments
- **Admin Dashboard**: Monitor payment status, student records, and reminders
- **Student Management**: Track student details, courses, and fee schedules
- **Payment Processing**: Record and manage fee payments
- **Notification System**: Customizable SMS templates and delivery tracking
- **Authentication**: Secure admin login system

## Project Structure

```
fee-management-system/
├── backend/                # AWS Lambda functions and API endpoints
│   ├── serverless.yml      # AWS infrastructure configuration
│   ├── src/                # Source code for backend services
│   │   ├── app.js          # Express app setup
│   │   ├── handlers/       # API route handlers
│   │   ├── lambda/         # Lambda functions
│   │   ├── models/         # Data models
│   │   └── utils/          # Utility functions
│   ├── config/             # Environment configuration templates
│   ├── docs/               # Documentation files
│   ├── tests/              # Test scripts and utilities
│   ├── utils/              # Utility scripts for maintenance
│   └── package.json        # Backend dependencies
├── database/               # Database schema and migrations
│   └── schema.sql          # SQL schema for reference
└── frontend/               # Admin panel web application
    └── aiict.in/admin/     # React-based admin interface
```

## Technology Stack

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **AWS Lambda**: Serverless compute service
- **DynamoDB**: NoSQL database service
- **Serverless Framework**: Infrastructure as code
- **Fast2SMS**: SMS delivery provider

### Frontend
- **React.js**: User interface library
- **Amazon S3**: Static website hosting
- **CloudFront**: Content delivery network

## Deployment

The system is deployed across multiple AWS services:

1. **Backend API**: AWS Lambda + API Gateway
   - Endpoint: https://v9xret02rk.execute-api.ap-south-1.amazonaws.com/pro/

2. **Admin Panel**: Amazon S3 + CloudFront
   - URL: https://admin.aiict.in

3. **Database**: Amazon DynamoDB
   - Tables: Students-pro, NotificationLogs-pro

## SMS Notification System

The system sends three types of automated reminders:

1. **Due Tomorrow**: For students with fees due the next day
2. **Due in 3 Days**: Early reminders for upcoming payments
3. **Overdue**: Reminders for missed payments

All SMS notifications are logged in the NotificationLogs-pro table for auditing and tracking.

## Environment Variables

The system uses the following environment variables:

```
JWT_SECRET=<secret-key>
ADMIN_EMAIL=admin@aiict.in
ADMIN_PASSWORD_HASH=<hashed-password>
CORS_ORIGIN=https://admin.aiict.in
FAST2SMS_API_KEY=<api-key>
SMS_ENABLED=true
INSTITUTE_NAME=AIICT
SUPPORT_PHONE=<phone-number>
```

## Maintenance

### AWS Lambda Functions

- **dailyFeeReminder**: Runs daily at 6:30 AM IST to send reminders
- **api**: Handles all admin panel API requests

### Database Schema

- **Students-pro**: Contains student records, courses, and fee details
- **NotificationLogs-pro**: Tracks all SMS notifications sent

## Recent Optimizations

1. **SMS Cost Reduction**: Replaced Unicode symbols with ASCII to reduce SMS segments
2. **API Performance**: Implemented better error handling and connection pooling
3. **Notification System**: Eliminated duplicate messages and unnecessary admin notifications
4. **Fast2SMS Integration**: Fixed API method from POST to GET for proper delivery

## Troubleshooting

### Common Issues

1. **Missing SMS Notifications**:
   - Check if SMS_ENABLED is set to 'true'
   - Verify FAST2SMS_API_KEY is correct
   - Ensure phone numbers are in correct format (10 digits)

2. **Admin Panel Access Issues**:
   - Verify CORS settings in serverless.yml
   - Check JWT_SECRET for authentication

3. **Lambda Function Errors**:
   - Review CloudWatch logs for detailed error messages
   - Check environment variables in AWS Lambda configuration

## Future Enhancements

1. **Payment Gateway Integration**: Online fee payment capabilities
2. **Student Portal**: Self-service access for students
3. **Report Generation**: Advanced analytics and reporting features
4. **Multi-Institute Support**: Support for multiple branches or institutions

## License

Proprietary - All rights reserved by AIICT

## Contact

For support or inquiries, contact admin@aiict.in
