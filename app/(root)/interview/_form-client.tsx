"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

const interviewTypes = ["Technical", "Behavioral", "Experience", "Problem Solving", "Leadership"]

export default function InterviewFormClient({ userId }: { userId: string }) {
  const [role, setRole] = useState("")
  const [level, setLevel] = useState("")
  const [amount, setAmount] = useState(5)
  const [techstack, setTechstack] = useState("")
  const [type, setType] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggleType = (t: string) => {
    setType((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch("/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify({
        role,
        level,
        amount,
        techstack,
        type: type.join(", "),
        userid: userId,
      }),
    })

    if (res.ok) {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-8">🎯 Interview Generation</h1>

      <Card className="bg-[#121212] border border-gray-800">
        <CardContent className="grid gap-6 p-6">
          <div className="grid gap-2">
            <Label htmlFor="role">Role for Interview</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-black border-gray-700"
              placeholder="e.g. Full Stack Developer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="level">Interview Level</Label>
            <Textarea
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-black border-gray-700"
              placeholder="e.g. Intermediate"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount of Questions</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-black border-gray-700"
              placeholder="e.g. 5"
            />
          </div>

          <div className="grid gap-2">
            <Label>Interview Type</Label>
            <div className="flex flex-wrap gap-4">
              {interviewTypes.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox
                    id={t}
                    checked={type.includes(t)}
                    onCheckedChange={() => toggleType(t)}
                  />
                  <Label htmlFor={t} className="capitalize text-sm">{t}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tech">Tech Stack</Label>
            <Textarea
              id="tech"
              value={techstack}
              onChange={(e) => setTechstack(e.target.value)}
              className="bg-black border-gray-700"
              placeholder="e.g. React, Node.js"
            />
          </div>

          <Button
            className="w-fit bg-blue-600 hover:bg-blue-500 mt-4"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Questions →"}
          </Button>

          {success && <p className="text-green-400 mt-2">✅ Interview saved!</p>}
        </CardContent>
      </Card>
    </main>
  )
}