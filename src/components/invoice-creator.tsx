"use client";

import { useState, useMemo, useRef, type ChangeEvent, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Upload,
  PlusCircle,
  Trash2,
  Download,
  Sparkles,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { suggestInvoiceItems, type SuggestInvoiceItemsOutput } from "@/ai/flows/suggest-invoice-items";
import { cn } from "@/lib/utils";

interface LineItem {
  id: number;
  quantity: number;
  description: string;
  amount: number;
}

type Suggestion = SuggestInvoiceItemsOutput["suggestions"][0];

export default function InvoiceCreator() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [fromAddress, setFromAddress] = useState("Your Company\n123 Main St\nAnytown, USA 12345");
  const [toAddress, setToAddress] = useState("Client Company\n456 Oak Ave\nOtherville, USA 54321");
  const [invoiceNumber, setInvoiceNumber] = useState("001");
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, quantity: 1, description: "Web Design Services", amount: 1500 },
    { id: 2, quantity: 10, description: "Hosting (12 months)", amount: 25 },
  ]);
  const [notes, setNotes] = useState("Thank you for your business!");
  const [taxRate, setTaxRate] = useState(8);

  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<Suggestion[]>([]);
  const [aiKeywords, setAIKeywords] = useState("");
  const [activePopover, setActivePopover] = useState<number | null>(null);


  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLineItemChange = (
    id: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addLineItem = () => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(item => item.id)) + 1 : 1;
    setLineItems([
      ...lineItems,
      { id: newId, quantity: 1, description: "", amount: 0 },
    ]);
  };

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };
  
  const handleSuggestionSelect = (id: number, suggestion: Suggestion) => {
    handleLineItemChange(id, "description", suggestion.description);
    handleLineItemChange(id, "amount", suggestion.amount);
    setActivePopover(null);
  };
  
  const getAISuggestions = async () => {
    if (!aiKeywords.trim()) {
      toast({
        variant: "destructive",
        title: "No keywords",
        description: "Please enter some keywords to get suggestions.",
      });
      return;
    }
    setIsAISuggesting(true);
    setAISuggestions([]);
    try {
      const result = await suggestInvoiceItems({ keywords: aiKeywords });
      setAISuggestions(result.suggestions);
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to get suggestions. Please try again.",
      });
    } finally {
      setIsAISuggesting(false);
    }
  };

  const subtotal = useMemo(
    () =>
      lineItems.reduce((acc, item) => acc + item.quantity * item.amount, 0),
    [lineItems]
  );
  const taxAmount = useMemo(
    () => subtotal * (taxRate / 100),
    [subtotal, taxRate]
  );
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  
  const handlePrint = () => {
    window.print();
  };
  
  useEffect(() => {
    if (activePopover === null) {
      setAIKeywords("");
      setAISuggestions([]);
    }
  }, [activePopover]);


  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M2 7L12 12M22 7L12 12M12 22V12M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            <h1 className="text-2xl font-bold font-headline text-foreground/80">
            InvoiceWise
            </h1>
        </div>
        <Button onClick={handlePrint} variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </header>

      <main>
        <Card className="mx-auto max-w-4xl print-card">
          <CardHeader className="p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
                {logo ? (
                  <Image
                    src={logo}
                    alt="Company Logo"
                    width={160}
                    height={160}
                    className="h-auto max-h-24 w-auto object-contain"
                    onClick={() => logoInputRef.current?.click()}
                    data-ai-hint="company logo"
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="h-24 w-48 flex-col gap-2"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span>Upload Logo</span>
                  </Button>
                )}
                 <Textarea
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Your Company & Address"
                  className="mt-4 print-textarea"
                  rows={4}
                />
              </div>
              <div className="space-y-4 text-left md:text-right">
                <CardTitle className="font-headline text-4xl text-foreground/80">INVOICE</CardTitle>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2 md:ml-auto md:w-full md:max-w-xs">
                  <Label htmlFor="invoice-number" className="text-right">Invoice #</Label>
                  <Input id="invoice-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="font-mono print-input" />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2 md:ml-auto md:w-full md:max-w-xs">
                  <Label htmlFor="issue-date" className="text-right">Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("justify-start text-left font-normal print-input", !issueDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 no-print">
                      <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2 md:ml-auto md:w-full md:max-w-xs">
                  <Label htmlFor="due-date" className="text-right">Due Date</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("justify-start text-left font-normal print-input", !dueDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 no-print">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
             <div className="mt-8">
              <Label htmlFor="bill-to">Bill To</Label>
              <Textarea
                id="bill-to"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Client's Name & Address"
                className="mt-2 print-textarea"
                rows={4}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table className="print-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="w-[15%] text-right">Quantity</TableHead>
                  <TableHead className="w-[15%] text-right">Price</TableHead>
                  <TableHead className="w-[15%] text-right">Total</TableHead>
                  <TableHead className="w-10 no-print"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(item.id, "description", e.target.value)
                          }
                          placeholder="Item description"
                          className="print-input"
                        />
                        <Popover open={activePopover === item.id} onOpenChange={(open) => setActivePopover(open ? item.id : null)}>
                          <PopoverTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 no-print">
                                <Sparkles className="h-4 w-4 text-accent" />
                             </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 no-print">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">AI Suggestions</h4>
                                <p className="text-sm text-muted-foreground">
                                  Enter keywords to get item suggestions.
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Input 
                                  placeholder="e.g. 'logo design'" 
                                  value={aiKeywords}
                                  onChange={(e) => setAIKeywords(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && getAISuggestions()}
                                />
                                <Button onClick={getAISuggestions} disabled={isAISuggesting}>
                                  {isAISuggesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Get Suggestions
                                </Button>
                              </div>
                              {aiSuggestions.length > 0 && (
                                <div className="space-y-2">
                                  {aiSuggestions.map((s, index) => (
                                    <Button key={index} variant="outline" className="w-full justify-between h-auto" onClick={() => handleSuggestionSelect(item.id, s)}>
                                      <span className="text-left flex-1 whitespace-normal">{s.description}</span>
                                      <span className="font-mono ml-4">${s.amount.toFixed(2)}</span>
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleLineItemChange(item.id, "quantity", e.target.valueAsNumber)
                        }
                        className="text-right print-input"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleLineItemChange(item.id, "amount", e.target.valueAsNumber)
                        }
                        className="text-right print-input"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(item.quantity * item.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="no-print">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              variant="outline"
              onClick={addLineItem}
              className="mt-4 no-print"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                 <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>Tax</span>
                    <Input 
                      type="number" 
                      value={taxRate} 
                      onChange={e => setTaxRate(e.target.valueAsNumber)}
                      className="w-16 h-8 text-right print-input"
                    />
                     <span>%</span>
                  </div>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="mt-2 print-textarea"
                rows={3}
              />
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
