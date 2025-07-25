import { db } from "@/firebase/admin"; // ✅ using firebase-admin
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import DownloadCSVButton from "@/components/DownloadCSVButton";
import { Button } from "@/components/ui/button";

// Fetch all feedback for an interview
async function getAllFeedbackForInterview(interviewId: string) {
  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Fetch user details from users collection
async function getUserById(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists ? userDoc.data() : null;
}

// Fetch interview details
async function getInterviewById(interviewId: string) {
  const interviewDoc = await db.collection("interviews").doc(interviewId).get();
  return interviewDoc.exists ? { id: interviewDoc.id, ...interviewDoc.data() } : null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
  transcript: Array<{
    role: string;
    content: string;
  }>;
  recordingUrl: string;
  attemptedCount: number;
}

const AllFeedbackPage = async ({ params }: RouteParams) => {
  const { id: interviewId } = await params;

  // ✅ Fetch interview details
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    redirect("/");
  }

  // ✅ Fetch all feedback for this interview
  let allFeedback: Feedback[] = await getAllFeedbackForInterview(interviewId);

  if (allFeedback.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold">No feedback yet</h1>
        <Button className="mt-4">
          <Link href="/" className="flex w-full justify-center">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // ✅ Sort by totalScore DESC
  allFeedback.sort((a, b) => b.totalScore - a.totalScore);

  // ✅ Fetch unique users
  const uniqueUserIds = [...new Set(allFeedback.map((fb) => fb.userId))];
  const userDocs = await Promise.all(
    uniqueUserIds.map((uid) => getUserById(uid))
  );
  const userMap = new Map<string, any>();
  uniqueUserIds.forEach((uid, idx) => userMap.set(uid, userDocs[idx]));

  const csvData = allFeedback.map((fb, index) => {
    const user = userMap.get(fb.userId);
    const username = user?.name || fb.userId;

    return {
      rank: index + 1,
      user: username,
      totalScore: fb.totalScore,
      attemptedCount: fb.attemptedCount,
      communication: fb.categoryScores?.[0]?.score ?? "-",
      technical: fb.categoryScores?.[1]?.score ?? "-",
      problemSolving: fb.categoryScores?.[2]?.score ?? "-",
      culturalFit: fb.categoryScores?.[3]?.score ?? "-",
      confidence: fb.categoryScores?.[4]?.score ?? "-",
      strengths: fb.strengths ?? [],
      areasForImprovement: fb.areasForImprovement ?? [],
      finalAssessment: fb.finalAssessment ?? "",
    };
  });

  return (
    <section className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          All Feedback for <span className="capitalize">{interview?.role}</span> Interview
        </h1>
        <DownloadCSVButton data={csvData} />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Participants</h3>
          <p className="text-2xl font-bold text-white">{allFeedback.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Average Score</h3>
          <p className="text-2xl font-bold text-white">
            {Math.round(allFeedback.reduce((sum, fb) => sum + fb.totalScore, 0) / allFeedback.length)}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Highest Score</h3>
          <p className="text-2xl font-bold text-white">{allFeedback[0]?.totalScore}</p>
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-6">
        {allFeedback.map((fb, index) => {
          const user = userMap.get(fb.userId);
          const username = user?.name || fb.userId;

          return (
            <div key={fb.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-200 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{username}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-2">
                        <Image src="/star.svg" width={18} height={18} alt="star" />
                        <span className="text-primary-200 font-bold">{fb.totalScore}</span>/100
                      </div>
                      <div className="flex items-center gap-2">
                        <Image src="/calendar.svg" width={18} height={18} alt="calendar" />
                        <span className="text-gray-300 text-sm">
                          {fb.createdAt ? dayjs(fb.createdAt).format("MMM D, YYYY h:mm A") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="btn-primary">
                  <Link href={`/interview/${interviewId}/all-feedbacks/${fb.id}`} className="flex items-center gap-2">
                    <span>View Full Report</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </Button>
              </div>

              <hr className="border-gray-600 my-4" />

              {/* Questions Attempted */}
              <div className="mb-4">
                <p className="text-center text-gray-300">
                  Questions Attempted: 
                  <span className="font-bold text-white ml-1">{fb.attemptedCount || 0}</span> / {interview.questions?.length || 0}
                </p>
              </div>

              {/* Final Assessment */}
              {fb.finalAssessment && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">{fb.finalAssessment}</p>
                </div>
              )}

              {/* Category Scores */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {fb.categoryScores?.map((category, catIndex) => (
                  <div key={catIndex} className="bg-gray-900 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400 mb-1">{category.name}</p>
                    <p className="text-lg font-bold text-white">{category.score}</p>
                  </div>
                )) || 
                // Fallback for legacy data structure
                ['Communication', 'Technical', 'Problem Solving', 'Cultural Fit', 'Confidence'].map((name, catIndex) => {
                  const score = fb.categoryScores?.[catIndex]?.score ?? "-";
                  return (
                    <div key={catIndex} className="bg-gray-900 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">{name}</p>
                      <p className="text-lg font-bold text-white">{score}</p>
                    </div>
                  );
                })}
              </div>

              {/* Strengths and Areas for Improvement */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {fb.strengths?.slice(0, 3).map((strength, strIndex) => (
                      <li key={strIndex} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    )) || <li className="text-sm text-gray-500">No strengths recorded</li>}
                    {fb.strengths?.length > 3 && (
                      <li className="text-sm text-gray-500">+{fb.strengths.length - 3} more...</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {fb.areasForImprovement?.slice(0, 3).map((area, areaIndex) => (
                      <li key={areaIndex} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{area}</span>
                      </li>
                    )) || <li className="text-sm text-gray-500">No areas recorded</li>}
                    {fb.areasForImprovement?.length > 3 && (
                      <li className="text-sm text-gray-500">+{fb.areasForImprovement.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to Dashboard Button */}
      <div className="mt-8 flex justify-center">
        <Button className="btn-secondary">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to Dashboard
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default AllFeedbackPage;