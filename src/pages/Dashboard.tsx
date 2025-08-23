
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, DollarSign, Target, TrendingUp,
  Calendar, Phone, Mail, MoreHorizontal, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics = [
  {
    title: "Total Customers",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Revenue",
    value: "$284,750",
    change: "+8.2%", 
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Active Deals",
    value: "156",
    change: "-2.1%",
    changeType: "negative" as const,
    icon: Target,
  },
  {
    title: "Conversion Rate",
    value: "24.3%",
    change: "+5.7%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "call",
    title: "Called John Smith",
    description: "Discussed Q4 requirements",
    time: "2 hours ago",
    icon: Phone,
  },
  {
    id: 2,
    type: "email", 
    title: "Email sent to Acme Corp",
    description: "Proposal for new contract",
    time: "4 hours ago",
    icon: Mail,
  },
  {
    id: 3,
    type: "meeting",
    title: "Meeting with Tech Solutions",
    description: "Product demo scheduled",
    time: "Yesterday",
    icon: Calendar,
  },
];

const upcomingTasks = [
  { id: 1, title: "Follow up with Sarah Johnson", priority: "high", due: "Today" },
  { id: 2, title: "Prepare proposal for MegaCorp", priority: "medium", due: "Tomorrow" },
  { id: 3, title: "Review contract terms", priority: "low", due: "Friday" },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-muted/20 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your sales overview.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${
                metric.changeType === 'positive' ? 'text-success' : 'text-destructive'
              }`}>
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' 
                        ? 'bg-destructive/10 text-destructive'
                        : task.priority === 'medium'
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.due}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
