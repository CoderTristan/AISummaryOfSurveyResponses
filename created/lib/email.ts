import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY!);
const appUrl = process.env.APP_URL

export async function sendFrequencyEmail({
  to,
  frequency,
  surveys,
}: {
  to: string;
  frequency: string;
  surveys: {
    question: string;
    currentCount: number;
  }[];
}) {
  const surveyListHtml = surveys
    .map(
      (s) => `
        <div style="margin-bottom: 16px;">
          <p><strong>Survey Question:</strong> ${s.question}</p>
          <p><strong>Responses:</strong> ${s.currentCount}</p>
        </div>
      `
    )
    .join("");

  return await resend.emails.send({
    from: "OneQ <no-reply@resend.dev>",
    to: [to],
    subject: `Your ${frequency} OneQ Summary`,
    html: `
      <h2>Your ${frequency} OneQ Summary</h2>

      <p>Here is the current status of your surveys:</p>

      ${surveyListHtml}

      <p>You will stop receiving alerts unless you increase the threshold.</p>

      <a href="${appUrl}/dashboard/projects" 
         style="display:inline-block;margin-top:16px;color:#4f46e5;text-decoration:underline;"
         target="_blank">
        Go to your Projects
      </a>
    `,
  });
}


export const sendPaymentFailedEmail = async (userEmail: string) => {
await resend.emails.send({
from: "OneQ <no-reply@resend.dev>",
to: userEmail,
subject: 'Your Payment Failed',
html: '<p>Your subscription payment failed. Please update your payment method.</p>',
});
};