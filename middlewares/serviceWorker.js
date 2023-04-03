const Checklist = require("../models/checklistModel");
const sendEmail = require("../utils/sendMail");
const Card = require("../models/cardModel");
const ErrorHandler = require("../utils/errorHandler");

/**
 * Check if any tasks are due tomorrow and send reminder emails to the assigned members
 */
async function checkDue() {
  try {
    // Set reminder date to tomorrow
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;
    const reminderDate = new Date(now.getTime() + oneDay);
    reminderDate.setHours(0, 0, 0, 0);

    // Find checklists with tasks due tomorrow
    const checklists = await Checklist.find({
      "content.dueDate": { $lte: reminderDate },
    }).populate("cardId");

    const dues = await Promise.all(
      checklists.map(async (checklist) => {
        // Filter tasks due tomorrow that have not been completed or reminded
        const contentDue = checklist.content.filter(
          (item) =>
            item.dueDate <= reminderDate &&
            item.isCompleted === false &&
            item.reminded === false
        );

        // Get card details and populate createdBy field
        const card = await Card.findById(checklist.cardId._id).populate(
          "createdBy"
        );

        if (contentDue.length > 0) {
          // Populate addMembers field with first name, last name, and email
          await checklist.populate(
            "content.addMembers",
            "firstName lastName email"
          );

          // Send reminder emails to assigned members and card creator
          for (const item of contentDue) {
            for (const addMember of item.addMembers) {
              if (!addMember.email) continue;
              await sendEmail({
                email: addMember.email,
                subject: "Reminder: Task due tomorrow",
                html: `Hello ${addMember.firstName}, this is a reminder that you have a task nameed: ${item.title}, due tomorrow. Please complete it before the deadline.`,
              });
            }
            await sendEmail({
              email: card.createdBy.email,
              subject: "Reminder: Task due tomorrow",
              html: `Hello ${card.createdBy.firstName}, this is a reminder that you have a task nameed: ${item.title}, due tomorrow. Please complete it before the deadline.`,
            });

            item.reminded = true;
            checklist.markModified("content");
            await checklist.save();
          }

          return { checklist: checklist, content: contentDue };
        }
      })
    );

    // Remove undefined values from dues array
    return dues.filter((item) => item !== undefined);
  } catch (error) {
    throw new ErrorHandler("Internal server error",500);
  }
}

module.exports = checkDue;
