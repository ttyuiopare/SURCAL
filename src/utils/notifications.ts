import { createClient } from './supabase/server';

/**
 * Mocks sending an email by inserting a record into the 'notifications' table.
 * Once you are ready for real emails (e.g., using Resend, SendGrid), 
 * you can replace the database insert with your API call hook here!
 */
export async function sendEmailNotification(userId: string, title: string, message: string) {
  const supabase = await createClient();
  
  // Later: const resend = new Resend('your-api-key'); 
  // await resend.emails.send({ to, subject: title, html: message });

  // For now, log it internally
  await supabase.from('notifications').insert([{
    user_id: userId,
    title,
    message
  }]);
  
  console.log(`[MOCK EMAIL SENT TO ${userId}]: ${title}`);
}
