"use client";

import { useCallback } from "react";

interface FeedbackData {
  rank: number;
  user: string;
  totalScore: number;
  attemptedCount: number;
  communication: number | string;
  technical: number | string;
  problemSolving: number | string;
  culturalFit: number | string;
  confidence: number | string;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
}

export default function DownloadCSVButton({ data }: { data: FeedbackData[] }) {
  const downloadCSV = useCallback(() => {
    if (!data || data.length === 0) {
      alert("No data available to download");
      return;
    }

    // ✅ CSV Headers (expanded)
    const headers = [
      "Rank",
      "User",
      "Total Score",
      "Attempted Questions",
      "Communication Skills",
      "Technical Knowledge",
      "Problem Solving",
      "Cultural Fit",
      "Confidence & Clarity",
      "Strengths",
      "Areas for Improvement",
      "Final Assessment",
    ];

    // ✅ Convert rows
    const rows = data.map((row) => [
      row.rank,
      `"${row.user}"`,
      row.totalScore,
      row.attemptedCount,
      row.communication,
      row.technical,
      row.problemSolving,
      row.culturalFit,
      row.confidence,
      `"${row.strengths?.join(", ")}"`,
      `"${row.areasForImprovement?.join(", ")}"`,
      `"${row.finalAssessment.replace(/"/g, '""')}"`, // Escape quotes
    ]);

    const csvContent =
      [headers, ...rows]
        .map((r) => r.join(","))
        .join("\n");

    // ✅ Create a blob & trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `interview_feedback_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  return (
    <button
      onClick={downloadCSV}
      className="px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-all"
    >
      ⬇ CSV
    </button>
  );
}
