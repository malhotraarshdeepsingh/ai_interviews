import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

import DownloadButtons from "@/components/DownloadButtons";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p className="w-full text-center">
        Questions Attempted:
        <span className="font-bold">{feedback?.attemptedCount || 0}</span> / {interview.questions.length}
      </p>

      <p>{feedback?.finalAssessment}</p>

      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-white">Interview Transcript</h3>
        <div className="transcript-container max-h-80 overflow-y-auto p-4 rounded-lg border border-gray-800 bg-black shadow-sm space-y-3">
          {feedback?.transcript?.map((entry, index) => (
            <div
              key={index}
              className={`p-3 rounded-md transition ${entry.role?.toLowerCase() === "assistant"
                ? "bg-blue-900/30 border-l-4 border-blue-400"
                : "bg-green-900/30 border-l-4 border-green-400"
                }`}
            >
              <p className="text-sm font-medium text-gray-300 capitalize">
                {entry.role}
              </p>
              <p className="text-gray-100">{entry.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <h4 className="font-semibold">Recorded Session:</h4>
        <video
          src={feedback?.recordingUrl}
          controls
          className="rounded-lg w-[300px] mt-2"
        />
        <DownloadButtons
          interviewId={id}
          interviewRole={interview.role}
          feedback={feedback}
          totalQuestions={interview.questions.length}
        />
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
