# CHAT + TASK MANAGEMENT API

### Introduction

This project is a mini for a team collaboration system, where teams/users can chat and also manage task.

### Project Support Features

- User can Signup and Login to their accounts
- Users can create group
- Users receives messages in real-time
- Users can create a team or private workspace
- Users can create tasks
- Users can assign task to members in the workspace
- Users can watch changes in task and recieve notifications on it
- Users get notified before task due date

## Installation Guide

## RUNNING ON LOCALLY ON MACHINE

### Pre-requisite

- [Node js](https://nodejs.org/en/download/)
- [Mongo DB](https://www.mongodb.com/try/download/shell)
- [Cloudinary]()

### Steps

- Clone this repository [here](https://github.com/Lekejosh/Team-Collaboration-Api.git).
- The master branch is the most stable at any given time, ensure you're working from it.
- Run "npm install" to install all dependencies
- Create an .env file in your project root folder and add your variables. See .env.sample for assistance.

### Usage

- Run 'npm start' to start the application.
- Connect to the API using Postman on port 4000.

## USING DOCKER

### Pre-requisite

- [Docker Destop(MAC)](https://desktop.docker.com/mac/main/arm64/Docker.dmg?utm_location=module) || [Docker Destop(Windows)](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe?utm_location=module) || [Docker Destop(Linux)](https://docs.docker.com/desktop/linux/install/)

### Steps

- After installing Docker desktop on your PC
- Change your DB_URI to 'mongodb://mongo_db:27017'
- Run `npm start:docker`

# API Endpoints

- Check [Postman Documentation](https://documenter.getpostman.com/view/17957003/2s9Xy5LVoa) for more info

## User Request

### Authentication

| HTTP Verbs | Endpoints                          | Action                                                                              |
| ---------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| POST       | /api/v1/user/register              | To sign up a new user account                                                       |
| POST       | /api/v1/user/login                 | To login an existing user account                                                   |
| GET        | /api/v1/user/logout                | To logout user sesssion                                                             |
| DELETE        | /api/v1/user/delete-account             | To delete user's account                                                             |
| POST       | /api/v1/user/deactivate            | To deactivate user's account                                                             |

### Password

| HTTP Verbs | Endpoints                        | Action                                                               |
| ---------- | -------------------------------- | -------------------------------------------------------------------- |
| POST       | /api/v1/user/forgot/password         | For users if password is forgotten |
| GET        | /api/v1/user/password/reset/:token             | Token is gotten from the mail sent to the user requesting for a password reset                             |
| PUT        | /api/v1/user/update/password              | To update password                                                    |


### OTP

| HTTP Verbs | Endpoints                | Action                            |
| ---------- | ------------------------ | --------------------------------- |
| GET       | /api/v1/user/generate/email/otp      | To generate OTP for user email verification |
| GET       | /api/v1/user/generate/mobile/otp      | To generate OTP for user mobile verification |
| POST       | /api/v1/user/verify/otp      | To verify mail and mobile |
### Profile

| HTTP Verbs | Endpoints                           | Action                                   |
| ---------- | ----------------------------------- | ---------------------------------------- |
| GET       | /api/v1/user/    | To get all users |
| GET       | /api/v1/user/search?search={{username/mobileNumber}}     | To search for user |
| GET       | /api/v1/user/me    | To Personal profile |
| PUT       | /api/v1/user/update/profile            | To update user profile information         |
| PUT        | /api/v1/user/update/mobile       | To update user's mobile number                  |
| PUT        | /api/v1/user/update/email             | To update User's email Address      |
| POST        | /api/v1/user/update/avatar | To update user's Profile avatar |
| DELETE        | /api/v1/user/update/avatar | To delete user's Profile avatar |

## Chat

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/chat    | Access or Create Chat |
| GET        | /api/v1/chat/fetch        | Fetch all login user's chat               |
| POST        | /api/v1/chat/create/group   | To Create group chat          |
| PUT     | /api/v1/chat/group/rename       | To rename Group chat            |
| PUT      | /api/v1/chat/group/add     | To add users to group chat           |
| PUT        | /api/v1/chat/group/remove        | To remove users from group chat            |
| PUT        | /api/v1/chat/group/icon/:chatId     | To add group chat icon      |
| DELETE     | /api/v1/chat/group/icon/:chatId     | To delete group chat icon             |
| DELETE      | /api/v1/chat/group/exit?group={{chatId}}     | To update a driver             |

## Messages

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/message    | Send Message|
| GET        | /api/v1/message/:chatId        | Fetch all chat messages              |
| POST        | /api/v1/message/send/audio   | Send audio message        |
| POST        | /api/v1/message/send/video   | Send video message        |
| POST        | /api/v1/message/send/image   | Send image message        |
| POST        | /api/v1/message/send/document   | Send document message        |
| DELETE     | /api/v1/message/:chatId/:messageId      | Delete message from self         |
| DELETE      | /api/v1/message/:chatId/:messageId/all    | Delete message from all           |
| POST        | /api/v1/message/read/:messageId       | To read message            |

## Task Management

### Board

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/task/:groupID    | Create workspace board|
| PUT        | /api/v1/task/board/:boardId    | Edit workspace board            |
| DELETE        | /api/v1/task/board/:boardId   | Delete Workspace board      |
| GET        | /api/v1/task/board/:boardId   | Get workspace board       |
| GET        | /api/v1/task/allboard  | Get all logged in user's board       |
| DELETE        | /api/v1/task/board/memeber-remove/:boardId?groupId={{groupId}}   | Send document message        |

### Task

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/task/create-task/:boardId?groupId={{groupId}}  | Create task in board |
| PUT        | /api/v1/task/edit/:taskId/:boardId?groupId={{groupId}}  | Edit board task          |
| GET        | /api/v1/task/get/:taskId   | Get board task    |
| DELETE        | /api/v1/task/delete/:taskId/:boardId  | Delete board task      |

### Card

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/task/card/:taskId?groupId={{groupId}}  | Create card in task |
| PUT        | /api/v1/task/card/edit/:cardId/:boardId?groupId={{groupId}}&taskId={{taskId}}  | Edit task card       |
| GET        | /api/v1/task/card/:cardId/:boardId   | Get task Card    |
| PUT        | /api/v1/task/card/member/:cardId/:boardId?groupId={{groupId}}&taskId={{taskId}} | Add member to task card     |
| DELETE | /api/v1/task/card/member/remove/:cardId?groupId={{groupId}}&taskId={{taskId}} | Remove member from task card |
| DELETE | /api/v1/task/card/:taskId/:cardId?groupId={{groupId}} | Delete task card |

### Checklist

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| POST       | /api/v1/task/checklist/:cardId?groupId={{groupId}}&taskId={{taskId}}  | Create card checklist |
| PUT        | /api/v1/task/editchecklist/edit/:checklistId?groupId={{groupId}}&taskId={{taskId}} | Edit card checklist         |
| DELETE        | /api/v1/task/checklist/delete/:checklistId/:cardId?groupId={{groupId}}&taskId={{taskId}}   | delete card checklist   |
| DELETE        | /api/v1/task/checklist/complete/:cardId/:checklistId?groupId={{groupId}}&taskId={{taskId}}&completed={{true/false}} | Complete/Incomplete card checlist      |

### Checklist Content

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| PUT       | /api/v1/task/checklist/content/add/:checklistId/:cardId  | Add content to checklist |
| PUT        | /api/v1/task/checklist/content/edit/:checklistId/:contentId/:cardId  | Edit checklist content          |
| PUT        | /api/v1/task/checklist/content/member/:checklistId/:contentId/:cardId   | Add member to checklist content    |
| DELETE        | /api/v1/task/checklist/content/member/:checklistId/:contentId/:cardId  | Delete member from checklist content      |
| PATCH   | /api/v1/task/checklist/content/complete/:checklistId/:contentId/:cardId | Complete checklist content  |
| DELETE | /api/v1/task/checklist/content/delete/:checklistId/:contentId/:cardId | Delete checklist content |

### Activity

| HTTP Verbs | Endpoints                    | Action                         |
| ---------- | ---------------------------- | ------------------------------ |
| GET       | /api/v1/activity?chatId={{groupId}} | Get all board activity |
| PUT        | /api/v1/activity/task?chatId={{groupId}}&taskId={{taskId}} | Get All activity by task          |
## Technologies Used

- [NodeJS](https://nodejs.org/) This is a cross-platform runtime environment built on Chrome's V8 JavaScript engine used in running JavaScript codes on the server. It allows for installation and managing of dependencies and communication with databases.
- [ExpressJS](https://www.expresjs.org/) This is a NodeJS web application framework.
- [MongoDB](https://www.mongodb.com/) This is a free open source NOSQL document database with scalability and flexibility. Data are stored in flexible JSON-like documents.
- [Mongoose ODM](https://mongoosejs.com/) This makes it easy to write MongoDB validation by providing a straight-forward, schema-based solution to model to application data.

### Author

- [Adeleke Joshua](https://github.com/lekejosh)

### License

This project is available for use under the MIT License.
