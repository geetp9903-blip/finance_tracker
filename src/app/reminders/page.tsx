import { getReminderTemplates } from "@/lib/dal/reminders";
import { getUser } from "@/lib/dal/auth";
import { ReminderList } from "@/components/reminders/ReminderList";
import { AddReminderForm } from "@/components/reminders/AddReminderForm";

export default async function RemindersPage() {
    const user = await getUser();
    const reminders = await getReminderTemplates();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction Reminders</h1>
                <p className="text-muted-foreground mt-1">
                    Manage expected recurring income & expenses to track on your dashboard cashflow forecast.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <AddReminderForm />
                </div>
                <div className="lg:col-span-2">
                    <ReminderList reminders={reminders} currency={user?.currency || 'INR'} />
                </div>
            </div>
        </div>
    );
}
