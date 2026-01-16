import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Calendar, Trophy, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreDisplay } from "@/components/score-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Match, Team, BallEvent, Player, PlayerMatchStats } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Matches() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    refetchInterval: 3000,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: ballEvents } = useQuery<BallEvent[]>({
    queryKey: ["/api/ball-events"],
    refetchInterval: 2000,
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: selectedMatchStats } = useQuery<PlayerMatchStats[]>({
    queryKey: ["/api/matches", selectedMatchId, "player-stats"],
    enabled: !!selectedMatchId,
  });

  const liveMatches = matches?.filter(m => m.status === "live") || [];
  const upcomingMatches = matches?.filter(m => m.status === "scheduled") || [];
  const completedMatches = matches?.filter(m => m.status === "completed") || [];

  const getTeam = (teamId: string) => teams?.find(t => t.id === teamId);
  const getPlayer = (playerId: string) => players?.find(p => p.id === playerId);
  const getMatchBalls = (matchId: string) => ballEvents?.filter(b => b.matchId === matchId) || [];

  const getPlayerShortName = (playerId: string | null | undefined) => {
    if (!playerId) return "TBD";
    const player = players?.find(p => p.id === playerId);
    if (!player?.name) return "Unknown";
    const parts = player.name.split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  };

  const getFirstBattingTeamId = (match: Match) => {
    if (!match.tossWinnerId || !match.tossDecision) return match.team1Id; // Fallback
    const isTeam1TossWinner = match.tossWinnerId === match.team1Id;
    const electedToBat = match.tossDecision === "bat";
    
    // Team 1 bats first if: (Team 1 won toss AND elected bat) OR (Team 2 won toss AND elected bowl)
    const team1BatsFirst = (isTeam1TossWinner && electedToBat) || (!isTeam1TossWinner && !electedToBat);
    return team1BatsFirst ? match.team1Id : match.team2Id;
  };

  const getCompletedMatchScorecard = (match: Match, stats: PlayerMatchStats[], innings: number) => {
    const firstBattingTeamId = getFirstBattingTeamId(match);
    const secondBattingTeamId = firstBattingTeamId === match.team1Id ? match.team2Id : match.team1Id;

    const battingTeamId = innings === 1 ? firstBattingTeamId : secondBattingTeamId;
    const bowlingTeamId = innings === 1 ? secondBattingTeamId : firstBattingTeamId;

    const battingPlayers = players?.filter(p => p.teamId === battingTeamId) || [];
    const bowlingPlayers = players?.filter(p => p.teamId === bowlingTeamId) || [];

    const batters = battingPlayers
      .map(player => {
        const playerStats = stats.find(s => s.playerId === player.id && s.innings === innings);
        // Show player if they faced balls OR got out OR were the striker/non-striker at end (inferred from external state, but rely on stats here)
        if (!playerStats || (playerStats.ballsFaced === 0 && !playerStats.isOut)) return null;
        return {
          id: player.id,
          name: getPlayerShortName(player.id),
          runs: playerStats.runsScored || 0,
          balls: playerStats.ballsFaced || 0,
          fours: playerStats.fours || 0,
          sixes: playerStats.sixes || 0,
          strikeRate: playerStats.ballsFaced ? ((playerStats.runsScored || 0) / playerStats.ballsFaced * 100).toFixed(1) : "0.0",
          isOut: playerStats.isOut || false,
          dismissal: playerStats.dismissalType || "not out",
          dismissedBy: playerStats.dismissedBy ? getPlayerShortName(playerStats.dismissedBy) : null,
        };
      })
      .filter(Boolean);

    const bowlers = bowlingPlayers
      .map(player => {
        const playerStats = stats.find(s => s.playerId === player.id && s.innings === innings);
        if (!playerStats || playerStats.oversBowled === "0.0") return null;
        const overs = parseFloat(playerStats.oversBowled || "0.0");
        return {
          id: player.id,
          name: getPlayerShortName(player.id),
          overs: playerStats.oversBowled || "0.0",
          runs: playerStats.runsConceded || 0,
          wickets: playerStats.wicketsTaken || 0,
          economy: overs > 0 ? ((playerStats.runsConceded || 0) / overs).toFixed(2) : "0.00",
        };
      })
      .filter(Boolean);

    return { batters, bowlers };
  };

  if (matchesLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Matches</h1>
          <p className="text-muted-foreground">
            Live scores and match updates
          </p>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="live" className="gap-2" data-testid="tab-live">
              <Play className="w-4 h-4" />
              Live ({liveMatches.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2" data-testid="tab-upcoming">
              <Calendar className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
              <Trophy className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {liveMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Live Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Check back later or view upcoming matches
                  </p>
                </CardContent>
              </Card>
            ) : (
              liveMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);
                const balls = getMatchBalls(match.id);
                const recentBalls = balls.slice(-12);

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} className="overflow-hidden" data-testid={`match-live-${match.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">Match #{match.matchNumber}</span>
                        <Badge className="bg-destructive/20 text-destructive gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ScoreDisplay match={match} team1={team1} team2={team2} variant="full" />

                      <div>
                        <p className="text-sm text-muted-foreground mb-3">This Over</p>
                        <div className="flex gap-2 flex-wrap">
                          {recentBalls.map((ball, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-display text-lg",
                                ball.isWicket 
                                  ? "bg-destructive text-destructive-foreground"
                                  : ball.runs === 4
                                    ? "bg-blue-500 text-white"
                                    : ball.runs === 6
                                      ? "bg-emerald-500 text-white"
                                      : ball.extraType
                                        ? "bg-amber-500 text-white"
                                        : "bg-muted"
                              )}
                            >
                              {ball.isWicket ? "W" : ball.extraType ? (ball.extraType === "wide" ? "Wd" : "Nb") : ball.runs}
                            </div>
                          ))}
                        </div>
                      </div>

                      {balls.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">Last Ball</p>
                          <div className="p-3 rounded-md bg-muted/50">
                            <p className="text-sm">
                              {(() => {
                                const lastBall = balls[balls.length - 1];
                                const batsman = getPlayer(lastBall.batsmanId);
                                const bowler = getPlayer(lastBall.bowlerId);
                                
                                if (lastBall.isWicket) {
                                  return `WICKET! ${batsman?.name || "Batsman"} is out (${lastBall.wicketType})`;
                                } else if (lastBall.runs === 6) {
                                  return `SIX! ${batsman?.name || "Batsman"} hits it out of the park!`;
                                } else if (lastBall.runs === 4) {
                                  return `FOUR! Beautiful shot by ${batsman?.name || "Batsman"}`;
                                } else if (lastBall.extraType === "wide") {
                                  return `Wide ball by ${bowler?.name || "Bowler"}`;
                                } else if (lastBall.extraType === "no_ball") {
                                  return `No ball by ${bowler?.name || "Bowler"}`;
                                } else {
                                  return `${lastBall.runs} run${lastBall.runs !== 1 ? "s" : ""} by ${batsman?.name || "Batsman"}`;
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Upcoming Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Matches will be scheduled by the admin
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} data-testid={`match-upcoming-${match.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                            style={{ backgroundColor: team1.primaryColor }}
                          >
                            {team1.shortName}
                          </div>
                          <span className="font-medium">{team1.name}</span>
                        </div>

                        <div className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Match #{match.matchNumber}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="font-medium">{team2.name}</span>
                          <div 
                            className="w-12 h-12 rounded-md flex items-center justify-center text-white font-display"
                            style={{ backgroundColor: team2.primaryColor }}
                          >
                            {team2.shortName}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedMatches.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Completed Matches</h3>
                  <p className="text-muted-foreground text-sm">
                    Results will appear here after matches are played
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);
                const winner = match.winnerId ? getTeam(match.winnerId) : null;

                if (!team1 || !team2) return null;

                return (
                  <Card key={match.id} data-testid={`match-completed-${match.id}`}>
                    <CardContent className="p-6">
                      <ScoreDisplay match={match} team1={team1} team2={team2} />
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        {winner ? (
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {winner.name} won {match.result === "super_over" ? "by Super Over" : ""}
                          </Badge>
                        ) : <div />}
                        <Button variant="outline" size="sm" onClick={() => setSelectedMatchId(match.id)}>
                          View Scorecard <ChevronRight className="ml-1 w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedMatchId} onOpenChange={(open) => !open && setSelectedMatchId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Match Scorecard</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[calc(90vh-100px)] pr-4">
            {selectedMatchId && matches && selectedMatchStats && (() => {
              const match = matches.find(m => m.id === selectedMatchId);
              if (!match) return null;

              const team1 = getTeam(match.team1Id);
              const team2 = getTeam(match.team2Id);
              if (!team1 || !team2) return null;
              
              const firstBattingTeamId = getFirstBattingTeamId(match);
              // Innings 1 Team is the one who batted first
              const innings1Team = firstBattingTeamId === match.team1Id ? team1 : team2;
              // Innings 2 Team is the one who batted second
              const innings2Team = firstBattingTeamId === match.team1Id ? team2 : team1;

              const innings1Stats = getCompletedMatchScorecard(match, selectedMatchStats, 1);
              const innings2Stats = getCompletedMatchScorecard(match, selectedMatchStats, 2);

              return (
                <div className="space-y-8">
                  {/* Innings 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-white font-display text-xs"
                          style={{ backgroundColor: innings1Team.primaryColor }}
                        >
                          {innings1Team.shortName}
                        </div>
                        <div>
                          <p className="font-semibold">{innings1Team.name} (1st Innings)</p>
                          <p className="text-sm text-muted-foreground">
                            {innings1Team.id === match.team1Id 
                              ? `${match.team1Score}/${match.team1Wickets} (${match.team1Overs})`
                              : `${match.team2Score}/${match.team2Wickets} (${match.team2Overs})`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Batter</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">B</TableHead>
                            <TableHead className="text-right">4s</TableHead>
                            <TableHead className="text-right">6s</TableHead>
                            <TableHead className="text-right">S/R</TableHead>
                            <TableHead>Dismissal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {innings1Stats.batters.map((batter) => batter && (
                            <TableRow key={batter.id}>
                              <TableCell className="font-medium">{batter.name}</TableCell>
                              <TableCell className="text-right font-display">{batter.runs}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{batter.balls}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{batter.fours}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{batter.sixes}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{batter.strikeRate}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {batter.isOut 
                                  ? `${batter.dismissal.replace("_", " ")} ${batter.dismissedBy ? `b ${batter.dismissedBy}` : ""}`
                                  : "not out"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {innings1Stats.batters.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No batting records
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Bowler</TableHead>
                            <TableHead className="text-right">O</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">W</TableHead>
                            <TableHead className="text-right">Econ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {innings1Stats.bowlers.map((bowler) => 
                            bowler && (
                              <TableRow key={bowler.id}>
                                <TableCell className="font-medium">{bowler.name}</TableCell>
                                <TableCell className="text-right">{bowler.overs}</TableCell>
                                <TableCell className="text-right">{bowler.runs}</TableCell>
                                <TableCell className="text-right font-display">{bowler.wickets}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{bowler.economy}</TableCell>
                              </TableRow>
                            )
                          )}
                          {innings1Stats.bowlers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No bowling records
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Innings 2 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-white font-display text-xs"
                          style={{ backgroundColor: innings2Team.primaryColor }}
                        >
                          {innings2Team.shortName}
                        </div>
                        <div>
                          <p className="font-semibold">{innings2Team.name} (2nd Innings)</p>
                          <p className="text-sm text-muted-foreground">
                            {innings2Team.id === match.team1Id 
                              ? `${match.team1Score}/${match.team1Wickets} (${match.team1Overs})`
                              : `${match.team2Score}/${match.team2Wickets} (${match.team2Overs})`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Batter</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">B</TableHead>
                            <TableHead className="text-right">4s</TableHead>
                            <TableHead className="text-right">6s</TableHead>
                            <TableHead className="text-right">S/R</TableHead>
                            <TableHead>Dismissal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {innings2Stats.batters.map((batter) => 
                            batter && (
                              <TableRow key={batter.id}>
                                <TableCell className="font-medium">{batter.name}</TableCell>
                                <TableCell className="text-right font-display">{batter.runs}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{batter.balls}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{batter.fours}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{batter.sixes}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{batter.strikeRate}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {batter.isOut 
                                    ? `${batter.dismissal.replace("_", " ")} ${batter.dismissedBy ? `b ${batter.dismissedBy}` : ""}`
                                    : "not out"}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          {innings2Stats.batters.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No batting records
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Bowler</TableHead>
                            <TableHead className="text-right">O</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">W</TableHead>
                            <TableHead className="text-right">Econ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {innings2Stats.bowlers.map((bowler) => 
                            bowler && (
                              <TableRow key={bowler.id}>
                                <TableCell className="font-medium">{bowler.name}</TableCell>
                                <TableCell className="text-right">{bowler.overs}</TableCell>
                                <TableCell className="text-right">{bowler.runs}</TableCell>
                                <TableCell className="text-right font-display">{bowler.wickets}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{bowler.economy}</TableCell>
                              </TableRow>
                            )
                          )}
                          {innings2Stats.bowlers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No bowling records
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
