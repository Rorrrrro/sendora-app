import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Send, Edit, Archive } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/dashboard-layout"

interface Campaign {
  id: string
  name: string
  status: "Draft" | "Scheduled" | "Sent" | "Active"
  recipients: number
  openRate: number
  clickRate: number
  sentDate: string
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Welcome Series",
    status: "Active",
    recipients: 1254,
    openRate: 32.5,
    clickRate: 12.3,
    sentDate: "2023-05-15",
  },
  {
    id: "2",
    name: "Monthly Newsletter - June",
    status: "Sent",
    recipients: 5431,
    openRate: 28.7,
    clickRate: 9.2,
    sentDate: "2023-06-01",
  },
  {
    id: "3",
    name: "Product Launch - New Feature",
    status: "Draft",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: "",
  },
  {
    id: "4",
    name: "Feedback Survey",
    status: "Sent",
    recipients: 2100,
    openRate: 45.2,
    clickRate: 22.8,
    sentDate: "2023-05-20",
  },
  {
    id: "5",
    name: "Summer Sale Promotion",
    status: "Scheduled",
    recipients: 8750,
    openRate: 0,
    clickRate: 0,
    sentDate: "2023-07-01",
  },
  {
    id: "6",
    name: "Re-engagement Campaign",
    status: "Draft",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: "",
  },
]

export default function CampaignsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">Create and manage your email campaigns.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground">
                {campaigns.filter((c) => c.status === "Active" || c.status === "Scheduled").length} active or scheduled
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  campaigns.reduce((acc, campaign) => acc + campaign.openRate, 0) /
                  campaigns.filter((c) => c.status === "Sent" || c.status === "Active").length
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-muted-foreground">Across all campaigns</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  campaigns.reduce((acc, campaign) => acc + campaign.clickRate, 0) /
                  campaigns.filter((c) => c.status === "Sent" || c.status === "Active").length
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-muted-foreground">Across all campaigns</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>Manage your email marketing campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search campaigns..."
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 transition-colors">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Recipients</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Open Rate</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Click Rate</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sent Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{campaign.name}</td>
                        <td className="p-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              campaign.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : campaign.status === "Sent"
                                  ? "bg-blue-100 text-blue-800"
                                  : campaign.status === "Scheduled"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{campaign.recipients.toLocaleString()}</td>
                        <td className="p-4 align-middle">{campaign.openRate}%</td>
                        <td className="p-4 align-middle">{campaign.clickRate}%</td>
                        <td className="p-4 align-middle">
                          {campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            {campaign.status === "Draft" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {campaign.status === "Draft" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View report</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                {campaign.status === "Active" && <DropdownMenuItem>Pause</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
