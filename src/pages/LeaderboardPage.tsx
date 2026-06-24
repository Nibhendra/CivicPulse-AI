import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mockLeaders = [
  { rank: 1, name: 'Priya S.', score: 92, issues: 24, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500' },
  { rank: 2, name: 'Rahul K.', score: 85, issues: 18, icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10', badge: 'bg-slate-400' },
  { rank: 3, name: 'Anita M.', score: 78, issues: 15, icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10', badge: 'bg-amber-700' },
];

export default function LeaderboardPage() {
  return (
    <div className="py-4 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 p-5">
          <Trophy className="h-10 w-10 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold">Community Heroes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top reporters making a difference
        </p>
      </div>

      {/* Podium */}
      <div className="space-y-3">
        {mockLeaders.map((leader) => (
          <Card
            key={leader.rank}
            className="overflow-hidden transition-all hover:shadow-md"
            style={{ animationDelay: `${leader.rank * 0.1}s`, animationFillMode: 'both' }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {/* Rank badge */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${leader.bg}`}>
                <leader.icon className={`h-4 w-4 ${leader.color}`} />
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-muted text-sm font-medium">
                  {leader.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {/* Name & issues */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{leader.name}</p>
                <p className="text-xs text-muted-foreground">
                  {leader.issues} issues reported
                </p>
              </div>

              {/* Score */}
              <Badge variant="secondary" className="shrink-0 font-mono text-sm">
                {leader.score}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Report issues and get upvotes to climb the leaderboard!
      </p>
    </div>
  );
}
