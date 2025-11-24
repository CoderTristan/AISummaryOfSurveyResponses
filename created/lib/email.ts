'use server'
import { Resend } from "resend";


const resend = new Resend(process.env.RESEND_KEY!);


export async function sendThresholdEmail({
    to,
surveyId,
question,
threshold,
currentCount,
}: {
to: string
surveyId: string;
question: string;
threshold: number;
currentCount: number;
}) {
await resend.emails.send({
from: "OneQ <no-reply@resend.dev>",
to: [to],
subject: `Survey ${surveyId} reached ${threshold} responses`,
html: `
<h2>Your OneQ Survey Reached Its Target</h2>
<p><strong>Survey:</strong> ${question}</p>
<p><strong>Responses:</strong> ${currentCount}/${threshold}</p>
<p>You will stop receiving alerts unless you increase the threshold.</p>
<a href="https://yourapp.com/dashboard" target="_blank">Open Dashboard</a>
`,
});
}

export const sendPaymentFailedEmail = async (userEmail: string) => {
await resend.emails.send({
from: 'billing@yoursite.com',
to: userEmail,
subject: 'Your Payment Failed',
html: '<p>Your subscription payment failed. Please update your payment method.</p>',
});
};