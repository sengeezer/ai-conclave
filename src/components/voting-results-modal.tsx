"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { VotingResult } from "@/types/models";
import { Trophy, Award, Medal } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface VotingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  votingResult: VotingResult;
}

function getModelName(modelId: string): string {
  // Fallback: extract name from ID (e.g. "openai/gpt-4" -> "GPT-4")
  const parts = modelId.split("/");
  if (parts.length > 1) {
    return parts[1]
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return modelId;
}

function getProviderColor(modelId: string): string {
  if (modelId.startsWith("google/")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (modelId.startsWith("anthropic/")) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  if (modelId.startsWith("openai/")) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (modelId.startsWith("x-ai/")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
}

export function VotingResultsModal({
  isOpen,
  onClose,
  votingResult,
}: VotingResultsModalProps) {
  const { responses, scores, votes, winnerId } = votingResult;

  // Filter to only successful responses
  const successfulResponses = responses.filter((r) => !r.error);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Voting Results
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="responses" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="responses">All Responses</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          </TabsList>

          {/* Responses Tab */}
          <TabsContent value="responses" className="flex-1 min-h-0">
            <ScrollArea className="h-[60vh] w-full">
              <div className="space-y-4 pr-4 w-full">
                {successfulResponses.map((response, index) => {
                  const score = scores.find((s) => s.modelId === response.modelId);
                  const isWinner = response.modelId === winnerId;
                  const rank = scores.findIndex((s) => s.modelId === response.modelId) + 1;

                  return (
                    <div
                      key={response.modelId}
                      className={`rounded-lg border overflow-hidden ${
                        isWinner
                          ? "border-yellow-500/50 bg-yellow-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between p-4 pb-0 mb-3">
                        <div className="flex items-center gap-2">
                          {rank === 1 && (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          )}
                          {rank === 2 && (
                            <Award className="h-5 w-5 text-gray-400" />
                          )}
                          {rank === 3 && (
                            <Medal className="h-5 w-5 text-amber-600" />
                          )}
                          <Badge
                            variant="outline"
                            className={getProviderColor(response.modelId)}
                          >
                            {getModelName(response.modelId)}
                          </Badge>
                          {isWinner && (
                            <Badge className="bg-yellow-500 text-yellow-950">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {score?.score || 0} points
                        </div>
                      </div>
                      <div className="p-4 pt-0 overflow-x-auto">
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-full"
                          style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere',
                            width: '100%',
                          }}
                        >
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              pre: ({ children }) => (
                                <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100 whitespace-pre max-w-full">
                                  {children}
                                </pre>
                              ),
                              code: ({ className, children, ...props }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code
                                    className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono break-all"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <code className={`${className} text-zinc-100`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              table: ({ children }) => (
                                <div className="overflow-x-auto max-w-full my-4">
                                  <table className="min-w-0 border-collapse">{children}</table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="border border-border px-3 py-2 text-left font-semibold bg-muted/50">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-border px-3 py-2 break-words">
                                  {children}
                                </td>
                              ),
                              a: ({ children, href, ...props }) => (
                                <a 
                                  href={href} 
                                  className="text-blue-500 hover:underline break-all"
                                  {...props}
                                >
                                  {children}
                                </a>
                              ),
                              p: ({ children }) => (
                                <p className="break-words my-2" style={{ overflowWrap: 'anywhere' }}>
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-6 my-2 space-y-1 break-words">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-6 my-2 space-y-1 break-words">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="break-words" style={{ overflowWrap: 'anywhere' }}>
                                  {children}
                                </li>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold mt-6 mb-3 break-words">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold mt-5 mb-2 break-words">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-bold mt-4 mb-2 break-words">
                                  {children}
                                </h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="text-base font-bold mt-3 mb-1 break-words">
                                  {children}
                                </h4>
                              ),
                              h5: ({ children }) => (
                                <h5 className="text-sm font-bold mt-2 mb-1 break-words">
                                  {children}
                                </h5>
                              ),
                              h6: ({ children }) => (
                                <h6 className="text-xs font-bold mt-2 mb-1 break-words">
                                  {children}
                                </h6>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic break-words">
                                  {children}
                                </blockquote>
                              ),
                              img: ({ src, alt }) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={src} 
                                  alt={alt || ''} 
                                  className="max-w-full h-auto rounded-lg my-2"
                                />
                              ),
                              hr: () => (
                                <hr className="my-4 border-border" />
                              ),
                            }}
                          >
                            {response.content}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </TabsContent>

          {/* Scorecard Tab */}
          <TabsContent value="scorecard" className="flex-1 min-h-0">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Score Table */}
                <div>
                  <h3 className="font-semibold mb-3">Final Scores</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Rank
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Model
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            1st Place Votes
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            2nd Place Votes
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Total Points
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => {
                          const firstPlaceVotes = score.votesReceived.filter(
                            (v) => v.firstChoice === score.modelId
                          ).length;
                          const secondPlaceVotes = score.votesReceived.filter(
                            (v) => v.secondChoice === score.modelId
                          ).length;

                          return (
                            <tr
                              key={score.modelId}
                              className={
                                index === 0 ? "bg-yellow-500/5" : ""
                              }
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {index === 0 && (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                  )}
                                  {index === 1 && (
                                    <Award className="h-4 w-4 text-gray-400" />
                                  )}
                                  {index === 2 && (
                                    <Medal className="h-4 w-4 text-amber-600" />
                                  )}
                                  <span className="text-sm">#{index + 1}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={getProviderColor(score.modelId)}
                                >
                                  {getModelName(score.modelId)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {firstPlaceVotes} × 2pts
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {secondPlaceVotes} × 1pt
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {score.score}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vote Breakdown */}
                <div>
                  <h3 className="font-semibold mb-3">Vote Breakdown</h3>
                  <div className="space-y-2">
                    {votes.length > 0 ? (
                      votes.map((vote, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                        >
                          <Badge
                            variant="outline"
                            className={getProviderColor(vote.voterId)}
                          >
                            {getModelName(vote.voterId)}
                          </Badge>
                          <span className="text-muted-foreground">voted:</span>
                          <span className="font-medium">
                            1st{" "}
                            <Badge
                              variant="outline"
                              className={getProviderColor(vote.firstChoice)}
                            >
                              {getModelName(vote.firstChoice)}
                            </Badge>
                          </span>
                          <span className="font-medium">
                            2nd{" "}
                            <Badge
                              variant="outline"
                              className={getProviderColor(vote.secondChoice)}
                            >
                              {getModelName(vote.secondChoice)}
                            </Badge>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No voting was performed (single model or not enough responses).
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
