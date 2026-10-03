PAYTRACK

PAYTRACK is a desktop application designed to help businesses and
individuals manage customer debts and payments in a simple and organized
way.

The application provides a centralized system for managing clients,
recording debts, tracking payments, and monitoring outstanding balances.

Features

Client management

Add, edit, and delete clients

Store client information

View the client's debt history

Debt management

Create and manage customer debts

Track the original debt amount

Monitor remaining balances

View debt details and history

Payment management

Record payments made by customers

Automatically track the remaining amount

View payment history

Associate payments with specific debts

Dashboard

Overview of total debts

Total payments

Remaining amounts

Customer statistics

Debt records

View customer debt history

Follow payment activity

Track outstanding balances over time

Desktop application

Designed for Windows desktop use

Local data storage

No internet connection required for normal data management

Technologies

PAYTRACK is built using:

Electron

React

Node.js

Express.js

SQLite

JavaScript

Project Structure

PAYTRACK/
├── client/          # React frontend
├── server/          # Node.js / Express backend
├── main.js          # Electron main process
├── package.json
└── README.md

Installation

Clone the repository:

git clone https://github.com/toubayes/PAYTRACK.git
cd PAYTRACK

Install the project dependencies:

npm install

Install the client dependencies if the frontend has a separate
package.json:

cd client
npm install
cd ..

Development

Start the application using the project's development command:

npm start

Depending on the project configuration, the frontend and backend may
need to be started separately.

Database

PAYTRACK uses SQLite for local data storage.

The database contains the information required for:

Clients

Debts

Payments

Debt records

Application data

Because PAYTRACK is intended to manage financial records, regular
database backups are recommended.

Main Workflow

A typical workflow is:

Create a client.

Add a debt for the client.

Record payments when the client pays.

PAYTRACK keeps track of the amount already paid.

The remaining balance can be viewed at any time.

Review the client's complete debt and payment history.

Purpose

PAYTRACK is focused specifically on debt and payment management. Its
goal is to provide a straightforward tool for businesses that need to
keep track of customers who buy now and pay later.

License

This project is currently proprietary software.

All rights reserved.

Author

Developed by Youcef Laala.
