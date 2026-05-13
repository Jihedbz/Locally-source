import { ChangeEvent, useMemo, useState } from 'react'
import { CheckCircle2, FileCode2, Hash, Layers, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

type Algorithm = (typeof algorithms)[number]

function formatHash(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function computeDigest(algorithm: Algorithm, value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest(algorithm, encoded)
  return formatHash(digest)
}

function tryFormatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return null
  }
}

function encodeBase64(value: string) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return 'Invalid text for Base64 encoding.'
  }
}

function decodeBase64(value: string) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return 'Invalid Base64 input.'
  }
}

const Tools = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [base64Input, setBase64Input] = useState('')
  const [hashInput, setHashInput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState<Algorithm>('SHA-256')
  const [hashOutput, setHashOutput] = useState('')

  const prettyJson = useMemo(() => {
    if (!jsonInput.trim()) return ''
    const formatted = tryFormatJson(jsonInput)
    return formatted ?? 'Invalid JSON — please check your payload.'
  }, [jsonInput])

  const base64Encoded = useMemo(() => {
    if (!base64Input.trim()) return ''
    return encodeBase64(base64Input)
  }, [base64Input])

  const base64Decoded = useMemo(() => {
    if (!base64Input.trim()) return ''
    return decodeBase64(base64Input)
  }, [base64Input])

  const handleHash = async () => {
    if (!hashInput.trim()) {
      setHashOutput('Enter text to generate a hash.')
      return
    }

    const digest = await computeDigest(hashAlgorithm, hashInput)
    setHashOutput(digest)
  }

  const copyToClipboard = async (value: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Developer Toolkit
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Quick utilities for developers working inside Locally. Format JSON, encode Base64, and
            generate cryptographic hashes without leaving the app.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Built for speed</CardTitle>
            <CardDescription>Useful helpers for everyday developer workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-5 text-primary" />
              Browser-only utilities with no server round trips
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="size-5 text-primary" />
              JSON validation and formatting in real time
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCode2 className="size-5 text-primary" />
              Base64 and hash generators for quick tasks
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById('json-editor')?.focus()}
            >
              Start with JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('hash-input')?.focus()}
            >
              Explore hashes
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xl font-semibold">
                <span>JSON Formatter</span>
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <CardDescription>
                Paste JSON and receive a validated, pretty-printed output.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="json-editor">JSON input</Label>
              <textarea
                id="json-editor"
                rows={8}
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
                placeholder='{"name":"Locally","version":"0.1.0"}'
                className="min-h-[180px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-ring/50"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Result</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prettyJson)}>
                  Copy result
                </Button>
              </div>
              <pre className="min-h-[180px] overflow-auto rounded-lg border border-input bg-muted/10 p-4 text-sm leading-6">
                {prettyJson || 'No JSON entered yet.'}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xl font-semibold">
                <span>Base64 Utility</span>
                <FileCode2 className="size-5 text-sky-500" />
              </div>
              <CardDescription>
                Encode and decode Base64 text for sharing, config, and quick checks.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="base64-input">Input text</Label>
              <Input
                id="base64-input"
                value={base64Input}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setBase64Input(event.target.value)
                }
                placeholder="Paste text or Base64 here"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Encoded</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(base64Encoded)}>
                  Copy
                </Button>
              </div>
              <div className="rounded-lg border border-input bg-muted/10 p-3 text-sm leading-6">
                {base64Encoded || 'No input to encode.'}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Decoded</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(base64Decoded)}>
                  Copy
                </Button>
              </div>
              <div className="rounded-lg border border-input bg-muted/10 p-3 text-sm leading-6">
                {base64Decoded || 'No input to decode.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xl font-semibold">
                <span>Hash Generator</span>
                <Hash className="size-5 text-violet-500" />
              </div>
              <CardDescription>
                Generate robust hashes for strings using standard algorithms.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="hash-input">Text to hash</Label>
                <Input
                  id="hash-input"
                  value={hashInput}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setHashInput(event.target.value)
                  }
                  placeholder="Enter any text to hash"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hash-algorithm">Algorithm</Label>
                <Select
                  value={hashAlgorithm}
                  onValueChange={(value) => setHashAlgorithm(value as Algorithm)}
                >
                  <SelectTrigger id="hash-algorithm" className="w-full">
                    <SelectValue>{hashAlgorithm}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {algorithms.map((algorithm) => (
                        <SelectItem key={algorithm} value={algorithm}>
                          {algorithm}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="default" onClick={handleHash}>
                Generate hash
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Hash output</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hashOutput)}>
                  Copy
                </Button>
              </div>
              <div className="rounded-lg border border-input bg-muted/10 p-4 text-sm leading-6">
                {hashOutput || 'Generate a hash to see the result.'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-2">
              <CardTitle>Utilities quick start</CardTitle>
              <CardDescription>
                One place for developer helpers that should live inside Locally.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Tips</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Use the JSON formatter to validate API payloads and config files.</li>
                <li>
                  Keep Base64 snippets handy when working with environment secrets or dev resources.
                </li>
                <li>Hash values before storing them in local test metadata.</li>
              </ul>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border border-input bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">1</span>
                  JSON validation is instant — no round trip required.
                </div>
              </div>
              <div className="rounded-lg border border-input bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">2</span>
                  Choose SHA-256 for standard hashing and SHA-512 for stronger digests.
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setJsonInput('{"name":"Locally","version":"0.1.0"}')}
            >
              Set sample JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBase64Input('Locally is awesome!')}>
              Sample Base64
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Tools
