"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  DEVICE_SELECTION = "DEVICE_SELECTION"
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<BlobPart[]>([]);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [attemptedCount, setAttemptedCount] = useState<number>(0);

  const loadMediaDevices = async () => {
    console.log("Loading media devices...");
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    const audioDevices = devices.filter((d) => d.kind === "audioinput");

    setCameras(videoDevices);
    setMicrophones(audioDevices);
    if (videoDevices[0]) setSelectedCamera(videoDevices[0].deviceId);
    if (audioDevices[0]) setSelectedMic(audioDevices[0].deviceId);
    console.log("Media devices loaded:", { cameras: videoDevices, microphones: audioDevices });
    setCallStatus(CallStatus.DEVICE_SELECTION);
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      });

      // ✅ Show live preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ✅ Prepare recorder (won’t start yet)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks.current, {
          type: "video/webm",
        });
        setRecordedBlob(blob);
        console.log("🎥 Recording stopped. Blob ready:", blob);

        console.log("Upload recording...");
        const uploadResult = await uploadRecording(blob);

        setUploadedData(uploadResult);

        if (uploadResult?.success && uploadResult.filePath) {
          setCallStatus(CallStatus.FINISHED);
        }
      };

      mediaRecorderRef.current = mediaRecorder;

      // ✅ Change status so user can “Start Interview”
      setCallStatus(CallStatus.PERMISSION_GRANTED);
      setPermissionError(null);
    } catch (err) {
      console.error("❌ Camera/Mic access denied:", err);
      setPermissionError("Camera & microphone access is required to start the interview.");
    }
  };

  const startRecording = () => {
    mediaRecorderRef.current?.start();
    console.log("🎥 Recording started...");
    setCallStatus(CallStatus.ACTIVE);

    // TODO: Uncomment when you want to start VAPI
    // await vapi.start(interviewer, { variableValues: { questions: formattedQuestions } });
  };

  const stopRecording = () => {
    // Stop recorder
    mediaRecorderRef.current?.stop();

    // Stop camera preview
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    // TODO: Uncomment when you want to stop VAPI
    // vapi.stop();
  }

  const uploadRecording = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");

    const res = await fetch("/api/save-recording", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("✅ Saved recording:", data);

    return data as UploadResponse;
  }

  function countAttemptedQuestions(messages: SavedMessage[], questions: string[]): number {
    let attempted = 0;

    questions.forEach((question) => {
      // ✅ Find the FIRST occurrence of this question in the transcript
      const questionIndex = messages.findIndex(
        (m) =>
          m.role === "assistant" &&
          similarity(m.content, question) > 0.5
      );

      if (questionIndex !== -1) {
        // ✅ Collect all user responses *after* this question until next assistant message
        let answered = false;

        for (let i = questionIndex + 1; i < messages.length; i++) {
          const msg = messages[i];

          if (msg.role === "assistant") break; // stop when next question appears

          if (msg.role === "user" && msg.content.trim().length > 3) {
            answered = true; // user said something meaningful
          }
        }

        if (answered) attempted++;
      }
    });

    return attempted;
  }

  function similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const common = [...wordsA].filter((w) => wordsB.has(w));
    return common.length / Math.max(wordsA.size, wordsB.size);
  }

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      // setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[], attemptedCount: number) => {
      console.log("handleGenerateFeedback");

      if (!uploadedData?.success || !uploadedData.filePath) {
        console.error("Recording URL missing (still uploading?)");
        return;
      }

      const recordingUrl = uploadedData.filePath;

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
        recordingUrl,
        attemptedCount: attemptedCount || 0,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      const attempted = countAttemptedQuestions(messages, questions);
      setAttemptedCount(attempted);
      console.log("Attempted questions:", attempted);

      handleGenerateFeedback(messages, attempted);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, questions]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    startRecording();

    let formattedQuestions = "";
    if (questions) {
      formattedQuestions = questions
        .map((question) => `- ${question}`)
        .join("\n");
    }

    await vapi.start(interviewer, {
      variableValues: {
        questions: formattedQuestions,
      },
    });

  };

  const handleDisconnect = async () => {
    stopRecording();
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content flex flex-col items-center">
            {/* Video preview (shown only after permission) */}
            {callStatus !== CallStatus.INACTIVE && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="rounded-xl w-[360px] h-[260px] object-cover shadow-md transition-all duration-300"
              />
            )}

            {/* Permission error message */}
            {permissionError && (
              <p className="text-red-500 text-sm mt-2 text-center">{permissionError}</p>
            )}

            {/* If no permission yet → show original avatar + name */}
            {callStatus === CallStatus.INACTIVE && (
              <>
                <Image
                  src="/user-avatar.png"
                  alt="profile-image"
                  width={120}
                  height={120}
                  className="rounded-full object-cover size-[120px]"
                />
                <h3 className="mt-2">{userName}</h3>
              </>
            )}

            {/* If permission granted, keep showing username below video */}
            {callStatus !== CallStatus.INACTIVE && (
              <h3 className="mt-3 text-lg font-semibold">{userName}</h3>
            )}
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="w-full justify-center flex gap-3">
        {callStatus === CallStatus.INACTIVE && (
          <button
            className="btn-call"
            onClick={loadMediaDevices}
          >
            Select Camera & Mic
          </button>
        )}

        {callStatus === CallStatus.DEVICE_SELECTION && (
          <div className="flex flex-col gap-4 p-4 border rounded-md">
            <h3 className="font-semibold">Choose Devices</h3>

            <label className="flex flex-col gap-1">
              Camera:
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="border p-2 rounded"
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Microphone:
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className="border p-2 rounded"
              >
                {microphones.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Mic ${mic.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn-primary"
              onClick={requestCameraAccess}
            >
              Confirm & Show Preview
            </button>
          </div>
        )}

        {(callStatus === CallStatus.PERMISSION_GRANTED || callStatus === CallStatus.CONNECTING) && (
          <button
            className="relative btn-primary px-6 py-2 flex items-center justify-center"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.CONNECTING && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-white opacity-75 animate-ping" />
              </span>
            )}

            <span className="relative">
              {callStatus === CallStatus.CONNECTING ? ". . ." : "Start Interview"}
            </span>
          </button>
        )}

        {callStatus === CallStatus.ACTIVE && (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
