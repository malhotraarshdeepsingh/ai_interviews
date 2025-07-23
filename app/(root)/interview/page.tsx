import { getCurrentUser } from "@/lib/actions/auth.action";
import InterviewFormClient from "./_form-client";

const Page = async () => {
  const user = await getCurrentUser();

  return <InterviewFormClient userId={user?.id || "guest"} />
};

export default Page;
