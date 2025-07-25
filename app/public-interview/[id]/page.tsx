import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const PublicInterviewDetails = async ({
  params,
  searchParams,
}: RouteParams) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { userId, userName, email } = resolvedSearchParams;

  const user = {
    id: userId || "guest",
    name: userName || "Guest User",
    email: email || "guest@example.com",
  };

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <>
      <div className="flex flex-row justify-between gap-4 mb-6">
        <div className="flex flex-row gap-6 items-center max-sm:flex-col max-sm:items-start">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize text-lg font-semibold">
              {interview.role} Interview
            </h3>
          </div>

          <div className="ml-2">
            <DisplayTechIcons techStack={interview.techstack} />
          </div>
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit text-sm">
          {interview.type}
        </p>
      </div>

      <div className="mt-8">
        <Agent
          userName={user?.name!}
          userId={user?.id}
          interviewId={id}
          type="interview"
          questions={interview.questions}
          feedbackId={feedback?.id}
        />
      </div>
    </>
  );
};

export default PublicInterviewDetails;
