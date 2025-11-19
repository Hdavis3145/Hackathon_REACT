import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check } from "lucide-react";

interface MedicationSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationLogId: string;
  medicationName: string;
}

export function MedicationSurvey({ 
  open, 
  onOpenChange, 
  medicationLogId,
  medicationName 
}: MedicationSurveyProps) {
  const [hasDizziness, setHasDizziness] = useState<number | null>(null);
  const [hasPain, setHasPain] = useState<number | null>(null);
  const [painLevel, setPainLevel] = useState<number>(5);
  const [appetiteLevel, setAppetiteLevel] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const submitSurveyMutation = useMutation({
    mutationFn: async () => {
      if (hasDizziness === null || hasPain === null || appetiteLevel === null) {
        throw new Error("Please answer all questions");
      }

      const response = await apiRequest("POST", "/api/surveys", {
        medicationLogId,
        medicationName,
        hasDizziness,
        hasPain,
        painLevel: hasPain === 1 ? painLevel : undefined,
        appetiteLevel,
        notes: notes.trim() || undefined,
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Survey submitted",
        description: "Thank you for sharing how you feel",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit survey",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setHasDizziness(null);
    setHasPain(null);
    setPainLevel(5);
    setAppetiteLevel(null);
    setNotes("");
  };

  const handleSubmit = () => {
    submitSurveyMutation.mutate();
  };

  const handleSkip = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">
            How do you feel?
          </DialogTitle>
          <DialogDescription className="text-xl">
            After taking {medicationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Dizziness Question */}
          <div className="space-y-4">
            <Label className="text-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Are you feeling dizzy?
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                data-testid="button-dizziness-no"
                variant={hasDizziness === 0 ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setHasDizziness(0)}
              >
                <Check className={`w-6 h-6 mr-2 ${hasDizziness === 0 ? 'opacity-100' : 'opacity-0'}`} />
                No
              </Button>
              <Button
                data-testid="button-dizziness-yes"
                variant={hasDizziness === 1 ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setHasDizziness(1)}
              >
                <Check className={`w-6 h-6 mr-2 ${hasDizziness === 1 ? 'opacity-100' : 'opacity-0'}`} />
                Yes
              </Button>
            </div>
          </div>

          {/* Pain Question */}
          <div className="space-y-4">
            <Label className="text-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Do you have pain?
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                data-testid="button-pain-no"
                variant={hasPain === 0 ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setHasPain(0)}
              >
                <Check className={`w-6 h-6 mr-2 ${hasPain === 0 ? 'opacity-100' : 'opacity-0'}`} />
                No Pain
              </Button>
              <Button
                data-testid="button-pain-yes"
                variant={hasPain === 1 ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setHasPain(1)}
              >
                <Check className={`w-6 h-6 mr-2 ${hasPain === 1 ? 'opacity-100' : 'opacity-0'}`} />
                Have Pain
              </Button>
            </div>
          </div>

          {/* Pain Level (conditional) */}
          {hasPain === 1 && (
            <div className="space-y-4">
              <Label className="text-2xl font-semibold">
                Pain level: {painLevel}
              </Label>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <Button
                    key={level}
                    data-testid={`button-pain-level-${level}`}
                    variant={painLevel === level ? "default" : "outline"}
                    className="min-h-16 text-xl font-bold"
                    onClick={() => setPainLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <p className="text-lg text-muted-foreground">
                1 = Mild pain, 10 = Severe pain
              </p>
            </div>
          )}

          {/* Appetite Question */}
          <div className="space-y-4">
            <Label className="text-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              How is your appetite?
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                data-testid="button-appetite-good"
                variant={appetiteLevel === 'good' ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setAppetiteLevel('good')}
              >
                <Check className={`w-6 h-6 mr-2 ${appetiteLevel === 'good' ? 'opacity-100' : 'opacity-0'}`} />
                Good
              </Button>
              <Button
                data-testid="button-appetite-reduced"
                variant={appetiteLevel === 'reduced' ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setAppetiteLevel('reduced')}
              >
                <Check className={`w-6 h-6 mr-2 ${appetiteLevel === 'reduced' ? 'opacity-100' : 'opacity-0'}`} />
                Reduced
              </Button>
              <Button
                data-testid="button-appetite-none"
                variant={appetiteLevel === 'none' ? "default" : "outline"}
                className="min-h-16 text-xl font-semibold"
                onClick={() => setAppetiteLevel('none')}
              >
                <Check className={`w-6 h-6 mr-2 ${appetiteLevel === 'none' ? 'opacity-100' : 'opacity-0'}`} />
                None
              </Button>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <Label className="text-2xl font-semibold">
              Additional notes (optional)
            </Label>
            <Textarea
              data-testid="input-survey-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other symptoms or feelings..."
              className="text-xl min-h-32"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              data-testid="button-survey-skip"
              variant="outline"
              className="min-h-16 text-xl font-semibold"
              onClick={handleSkip}
              disabled={submitSurveyMutation.isPending}
            >
              Skip
            </Button>
            <Button
              data-testid="button-survey-submit"
              className="min-h-16 text-xl font-semibold"
              onClick={handleSubmit}
              disabled={
                submitSurveyMutation.isPending ||
                hasDizziness === null ||
                hasPain === null ||
                appetiteLevel === null
              }
            >
              {submitSurveyMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
