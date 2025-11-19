import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CameraView from "@/components/CameraView";
import PillIdentification from "@/components/PillIdentification";
import { MedicationSurvey } from "@/components/MedicationSurvey";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Medication } from "@shared/schema";
import { insertMedicationSchema, insertMedicationLogSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface IdentifiedPill {
  pillName: string;
  pillType: string;
  pillImage: string;
  confidence: number;
  commonFor: string;
}

export default function Scan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(true);
  const [identifiedPill, setIdentifiedPill] = useState<IdentifiedPill | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [loggedMedication, setLoggedMedication] = useState<{ logId: string; name: string } | null>(null);
  const [showManualSelect, setShowManualSelect] = useState(false);

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const identifyMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/identify-pill", { imageData });
      return res.json();
    },
    onSuccess: (data: IdentifiedPill) => {
      setIdentifiedPill(data);
      setIsScanning(false);
    },
    onError: () => {
      toast({
        title: "Pill Not Detected",
        description: "No pill was detected. Please select your medication manually.",
      });
      setIsScanning(false);
      setShowManualSelect(true);
    },
  });

  const addMedicationAndLogMutation = useMutation({
    mutationFn: async (pillData: IdentifiedPill) => {
      let createdMedicationId: string | null = null;
      
      try {
        // Step 1: Add this medication to the schedule with validated default values
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Validate medication data with schema
        const validatedMedData = insertMedicationSchema.parse({
          name: pillData.pillName,
          dosage: "As prescribed",
          pillType: pillData.pillType,
          imageUrl: pillData.pillImage,
          times: [currentTime], // Schedule for current time
          pillsRemaining: 30, // Default to 30 pills
          refillThreshold: 7,
        });

        const createRes = await apiRequest("POST", "/api/medications", validatedMedData);
        if (!createRes.ok) {
          const errorText = await createRes.text();
          throw new Error(`Failed to create medication: ${errorText}`);
        }
        const createdMedication = await createRes.json();
        createdMedicationId = createdMedication.id;
        
        // Step 2: Wait for creation to complete, then immediately log the dose
        // Validate log data with schema
        const validatedLogData = insertMedicationLogSchema.parse({
          medicationId: createdMedication.id,
          medicationName: createdMedication.name,
          scheduledTime: currentTime,
          takenTime: new Date().toISOString(),
          status: "taken",
          confidence: pillData.confidence,
          scannedPillType: pillData.pillType,
        });

        const logRes = await apiRequest("POST", "/api/logs", validatedLogData);
        if (!logRes.ok) {
          const errorText = await logRes.text();
          throw new Error(`Failed to log medication dose: ${errorText}`);
        }
        const logResult = await logRes.json();
        
        return {
          medication: createdMedication,
          log: logResult,
        };
      } catch (error) {
        // Rollback: Delete the medication if log failed
        if (createdMedicationId) {
          try {
            await apiRequest("DELETE", `/api/medications/${createdMedicationId}`);
            console.log('Rolled back medication creation due to log failure');
          } catch (rollbackError) {
            console.error('Failed to rollback medication creation:', rollbackError);
          }
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Success",
        description: `${data.medication.name} added to schedule and dose logged`,
      });
      
      // Show survey dialog
      setLoggedMedication({
        logId: data.log.id,
        name: data.medication.name,
      });
      setShowSurvey(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medication and log dose",
        variant: "destructive",
      });
      // Reset state on error so user can retry
      setIsScanning(true);
      setIdentifiedPill(null);
    },
  });

  const logMutation = useMutation({
    mutationFn: async (pillData: IdentifiedPill) => {
      // Fetch current medications to ensure we have the latest data
      const medsResponse = await fetch("/api/medications", {
        credentials: "include",
      });
      
      if (!medsResponse.ok) {
        throw new Error("Failed to fetch medications");
      }
      
      const currentMedications: Medication[] = await medsResponse.json();
      
      // Find matching medication in schedule
      const matchingMed = currentMedications.find(m => m.name === pillData.pillName);
      
      if (!matchingMed) {
        throw new Error("Medication not found in schedule");
      }

      // Find the next scheduled time for this medication
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      let closestTime = matchingMed.times[0];
      let smallestDiff = Infinity;

      matchingMed.times.forEach(time => {
        const [hour, minute] = time.split(':').map(Number);
        const scheduleTimeInMinutes = hour * 60 + minute;
        const diff = Math.abs(scheduleTimeInMinutes - currentTimeInMinutes);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestTime = time;
        }
      });

      const logData = {
        medicationId: matchingMed.id,
        medicationName: matchingMed.name,
        scheduledTime: closestTime,
        takenTime: new Date().toISOString(),
        status: "taken",
        confidence: pillData.confidence,
        scannedPillType: pillData.pillType,
      };

      const res = await apiRequest("POST", "/api/logs", logData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Dose Logged",
        description: `${identifiedPill?.pillName} has been recorded`,
      });
      
      // Show survey dialog
      setLoggedMedication({
        logId: data.id,
        name: identifiedPill?.pillName || "Medication",
      });
      setShowSurvey(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log medication",
        variant: "destructive",
      });
    },
  });

  const handleCapture = (imageData: string) => {
    identifyMutation.mutate(imageData);
  };

  const handleConfirm = () => {
    if (identifiedPill) {
      logMutation.mutate(identifiedPill);
    }
  };

  const handleAddToSchedule = () => {
    if (identifiedPill) {
      addMedicationAndLogMutation.mutate(identifiedPill);
    }
  };

  const handleRetry = () => {
    setIdentifiedPill(null);
    setIsScanning(true);
  };

  const handleSurveyClose = () => {
    setShowSurvey(false);
    setLoggedMedication(null);
    setLocation("/");
  };

  const manualLogMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const medication = medications.find(m => m.id === medicationId);
      if (!medication) {
        throw new Error("Medication not found");
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      let closestTime = medication.times[0];
      let smallestDiff = Infinity;

      medication.times.forEach(time => {
        const [hour, minute] = time.split(':').map(Number);
        const scheduleTimeInMinutes = hour * 60 + minute;
        const diff = Math.abs(scheduleTimeInMinutes - currentTimeInMinutes);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestTime = time;
        }
      });

      const logData = {
        medicationId: medication.id,
        medicationName: medication.name,
        scheduledTime: closestTime,
        takenTime: new Date().toISOString(),
        status: "taken",
        confidence: 0, // Manual selection has 0 confidence
        scannedPillType: medication.pillType,
      };

      const res = await apiRequest("POST", "/api/logs", logData);
      return res.json();
    },
    onSuccess: (data, medicationId) => {
      const medication = medications.find(m => m.id === medicationId);
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Dose Logged",
        description: `${medication?.name} has been recorded`,
      });
      
      // Show survey dialog
      setLoggedMedication({
        logId: data.id,
        name: medication?.name || "Medication",
      });
      setShowSurvey(true);
      setShowManualSelect(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log medication",
        variant: "destructive",
      });
    },
  });

  const handleManualSelect = (medicationId: string) => {
    manualLogMutation.mutate(medicationId);
  };

  if (isScanning) {
    return (
      <CameraView
        onCapture={handleCapture}
        onCancel={() => setLocation("/")}
      />
    );
  }

  if (showManualSelect) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowManualSelect(false);
                setIsScanning(true);
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <h1 className="text-5xl font-bold">Select Your Medication</h1>
          </div>

          {medications.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-2xl text-center text-muted-foreground">
                  No medications scheduled yet. Add medications from the home page first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <Card
                  key={med.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => handleManualSelect(med.id)}
                  data-testid={`card-medication-${med.id}`}
                >
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                    {med.imageUrl && (
                      <img
                        src={med.imageUrl}
                        alt={med.name}
                        className="w-20 h-20 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">{med.name}</CardTitle>
                      <p className="text-2xl text-muted-foreground">{med.dosage}</p>
                    </div>
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {manualLogMutation.isPending && (
            <div className="mt-8 text-center">
              <p className="text-2xl text-muted-foreground">Logging medication...</p>
            </div>
          )}
        </div>

        {loggedMedication && (
          <MedicationSurvey
            open={showSurvey}
            onOpenChange={handleSurveyClose}
            medicationLogId={loggedMedication.logId}
            medicationName={loggedMedication.name}
          />
        )}
      </div>
    );
  }

  if (identifiedPill) {
    // Check if this pill matches any scheduled medication
    const matchingMed = medications.find(m => m.name === identifiedPill.pillName);

    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <PillIdentification
            pillName={identifiedPill.pillName}
            pillImage={identifiedPill.pillImage}
            confidence={identifiedPill.confidence}
            expectedPill={matchingMed?.name}
            onConfirm={matchingMed ? handleConfirm : undefined}
            onAddToSchedule={!matchingMed ? handleAddToSchedule : undefined}
            onRetry={handleRetry}
          />
        </div>
        
        {loggedMedication && (
          <MedicationSurvey
            open={showSurvey}
            onOpenChange={handleSurveyClose}
            medicationLogId={loggedMedication.logId}
            medicationName={loggedMedication.name}
          />
        )}
      </>
    );
  }

  return null;
}
