"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Video } from "lucide-react";
import jsPDF from "jspdf";

interface DownloadButtonsProps {
  interviewId: string;
  interviewRole: string;
  feedback: any;
  totalQuestions: number;
}

export default function DownloadButtons({
  interviewId,
  interviewRole,
  feedback,
  totalQuestions
}: DownloadButtonsProps) {
  const downloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    let y = 0;

    // === HEADER ===
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setFillColor(59, 130, 246); // blue accent line
    doc.rect(0, 26, pageWidth, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Feedback on the Interview", pageWidth / 2, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`${interviewRole} Interview`, pageWidth / 2, 21, { align: "center" });

    y = 38; // tighter start after header

    // === OVERVIEW SECTION ===
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y - 4, 180, 20, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y - 4, 180, 20, "S");

    // Overall score + Date (same block)
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Overall:", 20, y + 3);
    doc.setTextColor(59, 130, 246);
    doc.text(`${feedback?.totalScore || 0}/100`, 42, y + 3);

    doc.setTextColor(15, 23, 42);
    doc.text("Date:", 120, y + 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const dateText = feedback?.createdAt
      ? new Date(feedback.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "N/A";
    doc.text(dateText, 135, y + 3);

    y += 20; // smaller gap

    // Questions Attempted
    doc.setFillColor(254, 249, 195); // yellow
    doc.rect(15, y - 2, 180, 9, "F");
    doc.setDrawColor(251, 191, 36);
    doc.rect(15, y - 2, 180, 9, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Attempted:", 20, y + 4);
    doc.setTextColor(217, 119, 6);
    doc.text(`${feedback?.attemptedCount || 0} / ${totalQuestions}`, 50, y + 4);

    y += 15;

    // === FINAL ASSESSMENT ===
    if (feedback?.finalAssessment) {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Assessment Overview", 20, y);
      y += 6; // tighter spacing

      const lines = doc.splitTextToSize(feedback.finalAssessment, 170);
      const boxHeight = Math.max(12, lines.length * 4.2 + 4);

      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 3, 180, boxHeight, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(15, y - 3, 180, boxHeight, "S");

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(lines, 20, y + 2);
      y += boxHeight + 8; // reduced gap
    }

    // === CATEGORY BREAKDOWN ===
    if (feedback?.categoryScores?.length) {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Category Breakdown", 20, y);
      y += 7;

      feedback.categoryScores.forEach((category: { name: string; score: number; comment?: string }, idx: number) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(239, 246, 255);
        doc.rect(15, y - 2, 180, 8, "F");
        doc.setDrawColor(147, 197, 253);
        doc.rect(15, y - 2, 180, 8, "S");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.text(`${idx + 1}. ${category.name}`, 20, y + 3);

        const scoreColor: [number, number, number] =
          category.score >= 80
            ? [34, 197, 94]
            : category.score >= 60
              ? [251, 191, 36]
              : [239, 68, 68];
        doc.setTextColor(...scoreColor);
        doc.text(`${category.score}/100`, 160, y + 3);

        y += 10;

        if (category.comment) {
          const commentLines = doc.splitTextToSize(category.comment, 160);
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(9.5);
          doc.text(commentLines, 25, y);
          y += commentLines.length * 4.5 + 4;
        }
      });

      y += 6;
    }

    // === STRENGTHS ===
    if (feedback?.strengths?.length) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Strengths", 20, y);
      y += 7;

      doc.setFillColor(240, 253, 244);
      doc.rect(15, y - 3, 180, feedback.strengths.length * 6 + 6, "F");
      doc.setDrawColor(134, 239, 172);
      doc.rect(15, y - 3, 180, feedback.strengths.length * 6 + 6, "S");

      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      feedback.strengths.forEach((s: string) => {
        const lines = doc.splitTextToSize(`• ${s}`, 170);
        doc.text(lines, 20, y + 3);
        y += lines.length * 4.5;
      });

      y += 8;
    }

    // === AREAS FOR IMPROVEMENT ===
    if (feedback?.areasForImprovement?.length) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Areas for Improvement", 20, y);
      y += 7;

      doc.setFillColor(254, 242, 242);
      doc.rect(15, y - 3, 180, feedback.areasForImprovement.length * 6 + 6, "F");
      doc.setDrawColor(252, 165, 165);
      doc.rect(15, y - 3, 180, feedback.areasForImprovement.length * 6 + 6, "S");

      doc.setTextColor(220, 38, 38);
      doc.setFontSize(10);
      feedback.areasForImprovement.forEach((a: string) => {
        const lines = doc.splitTextToSize(`• ${a}`, 170);
        doc.text(lines, 20, y + 3);
        y += lines.length * 4.5;
      });

      y += 8;
    }

    // === FOOTER ===
    const footerY = pageHeight - 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY, 190, footerY);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8.5);
    doc.text("Generated by Interview Platform", pageWidth / 2, footerY + 6, { align: "center" });
    doc.text(`Report ID: ${interviewId}`, pageWidth / 2, footerY + 11, { align: "center" });

    const timestamp = new Date().toISOString().split("T")[0];
    doc.save(`interview-feedback-${interviewRole}-${timestamp}.pdf`);
  };

  const downloadTranscript = () => {
    const transcriptText = feedback?.transcript
      ?.map((entry: any) => `${entry.role.toUpperCase()}: ${entry.content}`)
      .join("\n\n");

    const blob = new Blob([transcriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-transcript-${interviewId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVideo = () => {
    const a = document.createElement("a");
    a.href = feedback?.recordingUrl!;
    a.download = `interview-recording-${interviewId}.mp4`;
    a.click();
  };

  return (
    <div className="mt-6 flex flex-wrap gap-4 justify-center">
      {/* Report Download */}
      <Button
        onClick={downloadReport}
        className="flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Download Report</span>
      </Button>

      {/* Transcript Download */}
      <Button
        onClick={downloadTranscript}
        className="flex items-center gap-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Download Transcript</span>
      </Button>

      {/* Video Download */}
      <Button
        onClick={downloadVideo}
        className="flex items-center gap-2 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
      >
        <Video className="w-4 h-4" />
        <span className="text-sm font-medium">Download Video</span>
      </Button>
    </div>
  );
}
