import { useState } from "react";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  User,
  LayoutDashboard,
  Package,
  MapPin,
  Car,
  Users,
  FileBarChart,
  Receipt,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";

const modulesList = [
  { value: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "Shipment", label: "Shipments Management", icon: Package },
  { value: "Trip Tracking", label: "Trip Tracking", icon: MapPin },
  { value: "Expenses", label: "Expense Management", icon: Receipt },
  { value: "Reports", label: "Reports & Analytics", icon: FileBarChart },
  { value: "Invoices", label: "Invoices & Billing", icon: FileText },
  { value: "Drivers", label: "Drivers Management", icon: Users },
  { value: "Vehicles", label: "Vehicles Management", icon: Car },
  { value: "Settings", label: "System Settings", icon: Settings },
];

export function HelpSupportPage() {
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!module) {
      setError("Please select a module.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the issue you are experiencing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env?.VITE_API_URL || "http://localhost:5000/api"}/support/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module,
          description,
          contactName,
          contactEmail,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setSubmitMessage(json.message || "Your ticket has been sent to support@madhuratechnologies.com using our SMTP server. Our technical team is reviewing your report.");
        // Clear form
        setModule("");
        setDescription("");
        setContactName("");
        setContactEmail("");
      } else {
        setError(json.message || "Failed to submit support ticket. Please try again.");
      }
    } catch (err) {
      console.error("Support submission error:", err);
      setError("Unable to connect to the support server. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-[#1d4ed8]" />
            Support from Madura Technologies
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Have a question or running into an issue? Tell us which system module is affected and our dedicated engineering team will resolve it.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#eff6ff] border border-[#bfdbfe] px-4 py-2.5 rounded-xl shadow-sm text-xs text-[#1e40af] font-medium">
          <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />
          Direct Channel to support@madhuratechnologies.com
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── FORM CARD ──────────────────────────────── */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <div className="bg-gradient-to-r from-[#1d4ed8]/5 to-transparent px-6 py-5 border-b border-border">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1d4ed8]" />
              Submit Support Ticket
            </h2>
          </div>

          <div className="p-6">
            {success ? (
              <div className="py-12 px-4 text-center max-w-md mx-auto space-y-5 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-foreground">Ticket Submitted Successfully!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {submitMessage}
                </p>
                <div className="pt-2">
                  <Button 
                    onClick={() => setSuccess(false)}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm gap-2"
                  >
                    Submit Another Issue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Submission failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Name (Optional but professional) */}
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactName"
                        type="text"
                        placeholder="John Doe"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        disabled={loading}
                        className="pl-9 h-10 border-border bg-white"
                      />
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="name@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        disabled={loading}
                        className="pl-9 h-10 border-border bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Module Dropdown Selector */}
                <div className="space-y-2">
                  <Label htmlFor="moduleSelect" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Which module is in issue? <span className="text-red-500">*</span></Label>
                  <Select value={module} onValueChange={setModule} disabled={loading}>
                    <SelectTrigger id="moduleSelect" className="w-full h-10 bg-white border-border">
                      <SelectValue placeholder="Select the affected system module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modulesList.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <SelectItem key={mod.value} value={mod.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-[#1d4ed8]/75" />
                              <span>{mod.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issue Description Area */}
                <div className="space-y-2">
                  <Label htmlFor="issueDescription" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Details & Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="issueDescription"
                    rows={6}
                    placeholder="Provide a detailed description of the issue. Include what actions led to the problem, error messages displayed, and any context that will help us debug."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="border-border bg-white min-h-[120px] resize-y focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-6 h-10 gap-2 shadow-sm font-medium transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Ticket...
                      </>
                    ) : (
                      <>
                        Submit Ticket
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

              </form>
            )}
          </div>
        </div>

        {/* ── INFO SIDEBAR ───────────────────────────── */}
        <div className="space-y-6">
          
          {/* Brand Info Panel */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[#1e40af] font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1d4ed8]" />
              Madura Technologies
            </h3>
            <p className="text-xs text-blue-800/80 mt-2 leading-relaxed">
              We build intelligent logistics, fleet management, and supply chain tracking systems designed to maximize productivity and efficiency.
            </p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                24/7 Priority Ticket Dispatch
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                Direct Email Response Team
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                SLA-bound Bug Investigation
              </div>
            </div>
          </div>


        </div>

      </div>

    </div>
  );
}
