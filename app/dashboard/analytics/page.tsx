"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  FileText,
  LineChart,
  Pill,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"

// Add the mobile hook import at the top with other imports
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'

// Inside the component, add the isMobile hook
export default function HealthAnalyticsPage() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<"3months" | "6months" | "year">("6months")
  const isMobile = useMobile()
  const [pdfError, setPdfError] = useState<string | null>(null)

  if (!user) {
    return null
  }

  // Mock health data
  const healthData = {
    overallScore: 72,
    scoreStatus: "At Risk",
    scoreChange: -3,
    lastUpdated: "2023-12-15",

    riskAssessments: [
      {
        id: "risk1",
        condition: "Type 2 Diabetes",
        riskLevel: "high",
        probability: 68,
        factors: [
          "Family history of diabetes",
          "Elevated blood glucose in last 3 lab reports",
          "BMI above recommended range",
          "Sedentary lifestyle",
        ],
        recommendations: [
          "Schedule HbA1c test",
          "Consult with endocrinologist",
          "Reduce sugar intake",
          "Increase physical activity",
        ],
        trend: "increasing",
      },
      {
        id: "risk2",
        condition: "Hypertension",
        riskLevel: "medium",
        probability: 42,
        factors: [
          "Elevated blood pressure readings in last 2 consultations",
          "Family history of cardiovascular disease",
          "High sodium diet",
        ],
        recommendations: [
          "Monitor blood pressure weekly",
          "Reduce sodium intake",
          "Consider stress management techniques",
        ],
        trend: "stable",
      },
      {
        id: "risk3",
        condition: "Respiratory Infection",
        riskLevel: "low",
        probability: 15,
        factors: ["Recent cough reported", "Seasonal allergies"],
        recommendations: ["Monitor symptoms", "Stay hydrated", "Rest adequately"],
        trend: "decreasing",
      },
    ],

    chronicConditions: [
      {
        id: "condition1",
        name: "Asthma",
        status: "Controlled",
        lastAssessment: "2023-11-10",
        trend: "stable",
        metrics: [
          { name: "Symptom Frequency", value: "Rare", change: "improved" },
          { name: "Inhaler Usage", value: "1-2 times/week", change: "stable" },
          { name: "Night Awakenings", value: "None", change: "improved" },
        ],
      },
    ],

    medications: [
      {
        id: "med1",
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: "2023-06-15",
        adherence: 92,
        refillDue: "2023-12-25",
        status: "Active",
      },
      {
        id: "med2",
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: "2023-09-01",
        adherence: 78,
        refillDue: "2023-12-20",
        status: "Active",
      },
      {
        id: "med3",
        name: "Ventolin Inhaler",
        dosage: "90mcg",
        frequency: "As needed",
        startDate: "2022-03-10",
        adherence: 100,
        refillDue: "2024-02-15",
        status: "Active",
      },
    ],

    interactions: [
      {
        id: "int1",
        medications: ["Lisinopril", "Potassium supplements"],
        severity: "moderate",
        description: "Potential for increased potassium levels",
        recommendation: "Monitor potassium levels regularly",
      },
    ],

    labReports: [
      {
        id: "lab1",
        date: "2023-11-05",
        type: "Comprehensive Metabolic Panel",
        abnormalResults: [
          { name: "Glucose", value: "126 mg/dL", range: "70-99 mg/dL", status: "High" },
          { name: "ALT", value: "45 U/L", range: "7-35 U/L", status: "High" },
        ],
        normalResults: 14,
      },
      {
        id: "lab2",
        date: "2023-08-12",
        type: "Lipid Panel",
        abnormalResults: [{ name: "LDL Cholesterol", value: "142 mg/dL", range: "<100 mg/dL", status: "High" }],
        normalResults: 5,
      },
    ],

    healthProgress: [
      {
        metric: "Blood Pressure",
        current: "138/88",
        previous: "142/92",
        target: "<120/80",
        trend: "improving",
        history: [
          { date: "2023-06-15", value: "142/92" },
          { date: "2023-08-20", value: "140/90" },
          { date: "2023-11-05", value: "138/88" },
        ],
      },
      {
        metric: "Blood Glucose",
        current: "126 mg/dL",
        previous: "132 mg/dL",
        target: "<100 mg/dL",
        trend: "improving",
        history: [
          { date: "2023-06-15", value: "132 mg/dL" },
          { date: "2023-08-20", value: "128 mg/dL" },
          { date: "2023-11-05", value: "126 mg/dL" },
        ],
      },
      {
        metric: "Weight",
        current: "182 lbs",
        previous: "188 lbs",
        target: "165 lbs",
        trend: "improving",
        history: [
          { date: "2023-06-15", value: "188 lbs" },
          { date: "2023-08-20", value: "185 lbs" },
          { date: "2023-11-05", value: "182 lbs" },
        ],
      },
    ],

    recentConsultations: [
      {
        id: "consult1",
        date: "2023-11-05",
        doctor: "Dr. Sarah Johnson",
        specialty: "Internal Medicine",
        primaryDiagnosis: "Hypertension, controlled",
        secondaryDiagnosis: "Pre-diabetes",
        followUpRecommended: true,
        followUpDate: "2024-02-05",
      },
      {
        id: "consult2",
        date: "2023-08-20",
        doctor: "Dr. Michael Chen",
        specialty: "Endocrinology",
        primaryDiagnosis: "Pre-diabetes",
        secondaryDiagnosis: "Vitamin D deficiency",
        followUpRecommended: true,
        followUpDate: "2023-11-20",
      },
    ],
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
      case "good":
      case "improving":
      case "improved":
      case "controlled":
      case "low":
        return "text-green-600"
      case "elevated":
      case "moderate":
      case "medium":
      case "stable":
        return "text-amber-600"
      case "high":
      case "critical":
      case "increasing":
      case "worsening":
      case "uncontrolled":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  // Helper function to get badge color
  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
      case "good":
      case "improving":
      case "improved":
      case "controlled":
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "elevated":
      case "moderate":
      case "medium":
      case "stable":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100"
      case "high":
      case "critical":
      case "increasing":
      case "worsening":
      case "uncontrolled":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Helper function to get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "increasing":
      case "worsening":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "improving":
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case "stable":
        return <Activity className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  // Update the PDF styles for a more professional and engaging design
  const pdfStyles = StyleSheet.create({
    page: {
      padding: 30,
      fontFamily: 'Helvetica',
      backgroundColor: '#FFFFFF',
    },
    header: {
      fontSize: 24,
      marginBottom: 10,
      color: '#166534', // green-800
      textAlign: 'center',
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 12,
      marginBottom: 20,
      color: '#4B5563', // gray-600
      textAlign: 'center',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB', // gray-200
      marginVertical: 15,
    },
    subHeader: {
      fontSize: 16,
      marginBottom: 10,
      marginTop: 15,
      color: '#166534', // green-800
      backgroundColor: '#F0FDF4', // green-50
      padding: 8,
      borderRadius: 4,
      fontWeight: 'bold',
    },
    scoreContainer: {
      backgroundColor: '#F0FDF4', // green-50
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: '#DCFCE7', // green-100
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    scoreCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#DCFCE7', // green-100
      borderWidth: 3,
      borderColor: '#16A34A', // green-600
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    scoreValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#166534', // green-800
    },
    scoreDetails: {
      flex: 1,
    },
    scoreStatus: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#166534', // green-800
      marginBottom: 5,
    },
    scoreDate: {
      fontSize: 10,
      color: '#6B7280', // gray-500
    },
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#1F2937', // gray-800
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB', // gray-200
      paddingBottom: 5,
    },
    text: {
      fontSize: 11,
      marginBottom: 5,
      color: '#4B5563', // gray-600
      lineHeight: 1.5,
    },
    boldText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1F2937', // gray-800
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6', // gray-100
    },
    label: {
      fontSize: 11,
      color: '#6B7280', // gray-500
      flex: 1,
    },
    value: {
      fontSize: 11,
      color: '#1F2937', // gray-800
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'right',
    },
    riskBox: {
      padding: 10,
      marginBottom: 10,
      backgroundColor: '#FEF2F2', // red-50
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444', // red-500
    },
    mediumRiskBox: {
      padding: 10,
      marginBottom: 10,
      backgroundColor: '#FFFBEB', // amber-50
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B', // amber-500
    },
    lowRiskBox: {
      padding: 10,
      marginBottom: 10,
      backgroundColor: '#ECFDF5', // green-50
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: '#10B981', // emerald-500
    },
    warningText: {
      color: '#B91C1C', // red-700
      fontWeight: 'bold',
      marginBottom: 5,
    },
    mediumText: {
      color: '#B45309', // amber-700
      fontWeight: 'bold',
      marginBottom: 5,
    },
    lowText: {
      color: '#047857', // emerald-700
      fontWeight: 'bold',
      marginBottom: 5,
    },
    progressSection: {
      backgroundColor: '#F9FAFB', // gray-50
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    metricCard: {
      width: '48%',
      marginBottom: 10,
      marginRight: '2%',
      padding: 8,
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB', // gray-200
    },
    metricValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1F2937', // gray-800
      marginBottom: 3,
    },
    metricLabel: {
      fontSize: 10,
      color: '#6B7280', // gray-500
    },
    progressBar: {
      height: 6,
      backgroundColor: '#E5E7EB', // gray-200
      borderRadius: 3,
      marginTop: 5,
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#16A34A', // green-600
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 30,
      right: 30,
      fontSize: 9,
      color: '#9CA3AF', // gray-400
      textAlign: 'center',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB', // gray-200
      paddingTop: 5,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      fontSize: 9,
      color: '#9CA3AF', // gray-400
    },
  });

  // Create an enhanced HealthReport component
  const HealthReport = ({ healthData }) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.header}>Health Analytics Report</Text>
        <Text style={pdfStyles.subtitle}>Generated on {new Date().toLocaleDateString()} • Confidential Medical Information</Text>
        
        {/* Overall Health Score */}
        <View style={pdfStyles.scoreContainer}>
          <View style={pdfStyles.scoreRow}>
            <View style={pdfStyles.scoreCircle}>
              <Text style={pdfStyles.scoreValue}>{healthData.overallScore}</Text>
            </View>
            <View style={pdfStyles.scoreDetails}>
              <Text style={pdfStyles.scoreStatus}>Overall Health Score: {healthData.scoreStatus}</Text>
              <Text style={pdfStyles.text}>
                {healthData.scoreChange > 0 
                  ? `Improved by ${healthData.scoreChange} points since last assessment`
                  : `Decreased by ${Math.abs(healthData.scoreChange)} points since last assessment`
                }
              </Text>
              <Text style={pdfStyles.scoreDate}>
                Last updated: {new Date(healthData.lastUpdated).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Health Concerns */}
        <Text style={pdfStyles.subHeader}>Key Health Concerns</Text>
        {healthData.riskAssessments
          .filter(risk => risk.riskLevel === 'high')
          .map((risk, index) => (
            <View key={index} style={pdfStyles.riskBox}>
              <Text style={pdfStyles.warningText}>{risk.condition}</Text>
              <Text style={pdfStyles.boldText}>Risk Level: High (Probability: {risk.probability}%)</Text>
              <Text style={pdfStyles.text}>Key factors: {risk.factors.slice(0, 2).join(", ")}</Text>
              <Text style={pdfStyles.text}>Recommended action: {risk.recommendations[0]}</Text>
            </View>
          ))
        }
        
        {healthData.labReports[0]?.abnormalResults.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.boldText}>Abnormal Lab Results:</Text>
            {healthData.labReports[0].abnormalResults.map((result, idx) => (
              <Text key={idx} style={pdfStyles.text}>• {result.name}: {result.value} (Normal range: {result.range})</Text>
            ))}
          </View>
        )}
        
        <View style={pdfStyles.divider} />

        {/* Disease Risk Assessment */}
        <Text style={pdfStyles.subHeader}>Disease Risk Assessment</Text>
        {healthData.riskAssessments.map((risk, index) => {
          const boxStyle = risk.riskLevel === 'high' 
            ? pdfStyles.riskBox 
            : risk.riskLevel === 'medium' 
              ? pdfStyles.mediumRiskBox 
              : pdfStyles.lowRiskBox;
          
          const textStyle = risk.riskLevel === 'high' 
            ? pdfStyles.warningText 
            : risk.riskLevel === 'medium' 
              ? pdfStyles.mediumText 
              : pdfStyles.lowText;
              
          return (
            <View key={index} style={boxStyle}>
              <Text style={textStyle}>{risk.condition}</Text>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Risk Probability:</Text>
                <Text style={pdfStyles.value}>{risk.probability}%</Text>
              </View>
              <Text style={pdfStyles.boldText}>Key Risk Factors:</Text>
              {risk.factors.map((factor, idx) => (
                <Text key={idx} style={pdfStyles.text}>• {factor}</Text>
              ))}
              <Text style={pdfStyles.boldText}>Recommendations:</Text>
              {risk.recommendations.map((rec, idx) => (
                <Text key={idx} style={pdfStyles.text}>• {rec}</Text>
              ))}
            </View>
          );
        })}
        
        <View style={pdfStyles.divider} />

        {/* Health Progress */}
        <Text style={pdfStyles.subHeader}>Health Progress</Text>
        <View style={pdfStyles.progressSection}>
          <View style={pdfStyles.metricsGrid}>
            {healthData.healthProgress.map((metric, index) => {
              let progress = 50; // Default progress
              
              // Calculate progress percentage based on target and current values
              if (metric.metric === "Weight") {
                const current = parseInt(metric.current);
                const previous = parseInt(metric.previous);
                const target = parseInt(metric.target);
                
                if (previous > target) {
                  // Want to reduce (weight)
                  progress = 100 - Math.min(100, (current - target) / (previous - target) * 100);
                } else {
                  // Want to increase
                  progress = Math.min(100, (current - previous) / (target - previous) * 100);
                }
              }
              
              return (
                <View key={index} style={pdfStyles.metricCard}>
                  <Text style={pdfStyles.metricValue}>{metric.current}</Text>
                  <Text style={pdfStyles.metricLabel}>{metric.metric}</Text>
                  <View style={pdfStyles.progressBar}>
                    <View style={[pdfStyles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={[pdfStyles.text, { marginTop: 5 }]}>
                    Target: {metric.target} • Trend: {metric.trend}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={pdfStyles.divider} />

        {/* Medications */}
        <Text style={pdfStyles.subHeader}>Current Medications</Text>
        {healthData.medications.map((med, index) => (
          <View key={index} style={[pdfStyles.section, { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 4, marginBottom: 8 }]}>
            <Text style={pdfStyles.boldText}>{med.name} ({med.dosage})</Text>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Frequency:</Text>
              <Text style={pdfStyles.value}>{med.frequency}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Started:</Text>
              <Text style={pdfStyles.value}>{new Date(med.startDate).toLocaleDateString()}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Next Refill Due:</Text>
              <Text style={pdfStyles.value}>{new Date(med.refillDue).toLocaleDateString()}</Text>
            </View>
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Adherence Rate:</Text>
              <Text style={pdfStyles.value}>{med.adherence}%</Text>
            </View>
          </View>
        ))}
        
        {healthData.interactions.length > 0 && (
          <View style={[pdfStyles.section, { backgroundColor: '#FFFBEB', padding: 8, borderRadius: 4, marginTop: 5 }]}>
            <Text style={pdfStyles.mediumText}>Medication Interaction Warning</Text>
            {healthData.interactions.map((interaction, idx) => (
              <Text key={idx} style={pdfStyles.text}>
                • Interaction between {interaction.medications.join(" and ")}: {interaction.description}
              </Text>
            ))}
          </View>
        )}
        
        <View style={pdfStyles.divider} />
        
        {/* Lab Reports */}
        <Text style={pdfStyles.subHeader}>Recent Lab Results</Text>
        {healthData.labReports.map((report, index) => (
          <View key={index} style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>{report.type} ({new Date(report.date).toLocaleDateString()})</Text>
            {report.abnormalResults.map((result, idx) => (
              <View key={idx} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{result.name}:</Text>
                <Text style={[pdfStyles.value, { color: '#DC2626' }]}>{result.value} (Range: {result.range})</Text>
              </View>
            ))}
            <Text style={pdfStyles.text}>Normal results: {report.normalResults} markers within range</Text>
          </View>
        ))}
        
        <View style={pdfStyles.divider} />
        
        {/* Recent Consultations */}
        <Text style={pdfStyles.subHeader}>Recent Consultations</Text>
        {healthData.recentConsultations.map((consult, index) => (
          <View key={index} style={[pdfStyles.section, { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 4, marginBottom: 8 }]}>
            <Text style={pdfStyles.boldText}>
              {new Date(consult.date).toLocaleDateString()} - {consult.doctor}
            </Text>
            <Text style={pdfStyles.text}>Specialty: {consult.specialty}</Text>
            <Text style={pdfStyles.boldText}>Primary Diagnosis:</Text>
            <Text style={pdfStyles.text}>{consult.primaryDiagnosis}</Text>
            {consult.secondaryDiagnosis && (
              <>
                <Text style={pdfStyles.boldText}>Secondary Diagnosis:</Text>
                <Text style={pdfStyles.text}>{consult.secondaryDiagnosis}</Text>
              </>
            )}
            {consult.followUpRecommended && (
              <Text style={[pdfStyles.text, { color: '#2563EB' }]}>
                Follow-up scheduled for {new Date(consult.followUpDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
        
        <Text style={pdfStyles.footer}>
          This report contains confidential medical information for personal use. Please consult with your healthcare provider before making any health decisions.
        </Text>
        
        <Text style={pdfStyles.pageNumber}>Page 1</Text>
      </Page>
      
      {/* Second page for recommendations and additional information */}
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.header}>Personalized Recommendations</Text>
        <Text style={pdfStyles.subtitle}>Based on your health data and risk factors</Text>
        
        <Text style={pdfStyles.subHeader}>Lifestyle Recommendations</Text>
        
        <View style={[pdfStyles.section, { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, marginBottom: 15 }]}>
          <Text style={[pdfStyles.boldText, { color: '#1D4ED8', marginBottom: 8 }]}>Physical Activity</Text>
          <Text style={pdfStyles.text}>
            Based on your improving blood pressure and glucose levels, we recommend continuing to increase
            your physical activity to 30 minutes of moderate exercise at least 5 days per week.
          </Text>
          <Text style={pdfStyles.text}>
            Consider activities like brisk walking, swimming, or cycling that are gentle on joints but effective
            for cardiovascular health.
          </Text>
        </View>
        
        <View style={[pdfStyles.section, { backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, marginBottom: 15 }]}>
          <Text style={[pdfStyles.boldText, { color: '#166534', marginBottom: 8 }]}>Dietary Improvements</Text>
          <Text style={pdfStyles.text}>
            Your weight trend is positive. Continue reducing processed foods and sugars while increasing
            fiber intake to help manage your pre-diabetes risk.
          </Text>
          <Text style={pdfStyles.text}>
            Focus on whole grains, lean proteins, and plenty of vegetables. Consider meeting with a dietitian
            to create a personalized meal plan.
          </Text>
        </View>
        
        <View style={[pdfStyles.section, { backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8, marginBottom: 15 }]}>
          <Text style={[pdfStyles.boldText, { color: '#B45309', marginBottom: 8 }]}>Stress Management</Text>
          <Text style={pdfStyles.text}>
            Consider adding stress reduction techniques like meditation or deep breathing exercises to help
            further improve your blood pressure readings.
          </Text>
          <Text style={pdfStyles.text}>
            Even 10 minutes of mindfulness practice daily can have significant benefits for your cardiovascular
            health and overall wellbeing.
          </Text>
        </View>
        
        <View style={pdfStyles.divider} />
        
        <Text style={pdfStyles.subHeader}>Upcoming Health Actions</Text>
        
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.boldText}>Schedule These Appointments:</Text>
          <Text style={pdfStyles.text}>• Follow-up with Dr. Sarah Johnson (Internal Medicine) by {new Date(healthData.recentConsultations[0].followUpDate).toLocaleDateString()}</Text>
          <Text style={pdfStyles.text}>• Consultation with Endocrinologist to assess diabetes risk</Text>
          <Text style={pdfStyles.text}>• Schedule HbA1c test within the next 30 days</Text>
        </View>
        
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.boldText}>Medication Reminders:</Text>
          {healthData.medications.map((med, index) => (
            <Text key={index} style={pdfStyles.text}>
              • Refill {med.name} by {new Date(med.refillDue).toLocaleDateString()}
            </Text>
          ))}
        </View>
        
        <View style={pdfStyles.divider} />
        
        <Text style={pdfStyles.subHeader}>Health Goals</Text>
        
        <View style={pdfStyles.progressSection}>
          <View style={pdfStyles.metricsGrid}>
            {healthData.healthProgress.map((metric, index) => (
              <View key={index} style={[pdfStyles.metricCard, { width: '100%', marginRight: 0 }]}>
                <Text style={pdfStyles.boldText}>{metric.metric} Goal</Text>
                <Text style={pdfStyles.text}>Current: {metric.current} → Target: {metric.target}</Text>
                <Text style={pdfStyles.text}>
                  Recommendation: {
                    metric.metric === "Blood Pressure" ? "Continue monitoring weekly and maintain medication schedule." :
                    metric.metric === "Blood Glucose" ? "Reduce simple carbohydrates and increase fiber intake." :
                    "Maintain current exercise routine and diet changes."
                  }
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <Text style={pdfStyles.footer}>
          This report contains confidential medical information for personal use. Please consult with your healthcare provider before making any health decisions.
        </Text>
        
        <Text style={pdfStyles.pageNumber}>Page 2</Text>
      </Page>
    </Document>
  );

  // Update the Export Report button in the main component
  // Replace the existing Export Report button with:
  <PDFDownloadLink
    document={<HealthReport healthData={healthData} />}
    fileName={`health-report-${new Date().toISOString().split('T')[0]}.pdf`}
  >
    {({ blob, url, loading, error }) => {
      if (error) {
        setPdfError(error.message || "Failed to generate PDF");
      }
      
      return (
        <Button 
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <FileText className="h-4 w-4 mr-2" />
          {loading ? 'Generating Report...' : 'Export Report'}
        </Button>
      );
    }}
  </PDFDownloadLink>

  // In the return statement, update the layout to be responsive
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Analytics</h1>
          <p className="text-muted-foreground">View your health status, risks, and progress over time</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={timeRange} onValueChange={(value: "3months" | "6months" | "year") => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Past 3 Months</SelectItem>
              <SelectItem value="6months">Past 6 Months</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
          <PDFDownloadLink
            document={<HealthReport healthData={healthData} />}
            fileName={`health-report-${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ blob, url, loading, error }) => {
              if (error) {
                setPdfError(error.message || "Failed to generate PDF");
              }
              
              return (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating Report...' : 'Export Report'}
                </Button>
              );
            }}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Health Score Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-muted-foreground mb-2">Overall Health Score</div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-bold">{healthData.overallScore}</div>
                <div
                  className={`text-lg font-medium mb-1 ${
                    healthData.scoreStatus === "Healthy"
                      ? "text-green-600"
                      : healthData.scoreStatus === "At Risk"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {healthData.scoreStatus}
                </div>
              </div>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                {healthData.scoreChange > 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600">+{healthData.scoreChange}</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                    <span className="text-red-600">{healthData.scoreChange}</span>
                  </>
                )}
                <span className="ml-1">from last assessment</span>
              </div>
              <Progress value={healthData.overallScore} className="h-2 mt-3" />
              <div className="text-xs text-muted-foreground mt-2">
                Last updated: {new Date(healthData.lastUpdated).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Key Health Concerns</div>
              <ul className="space-y-2">
                {healthData.riskAssessments
                  .filter((risk) => risk.riskLevel === "high")
                  .map((risk) => (
                    <li key={risk.id} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{risk.condition} (High Risk)</span>
                    </li>
                  ))}
                {healthData.labReports[0]?.abnormalResults.map((result, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Abnormal {result.name}: {result.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Upcoming Actions</div>
              <ul className="space-y-2">
                {healthData.recentConsultations[0]?.followUpRecommended && (
                  <li className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Follow-up appointment on{" "}
                      {new Date(healthData.recentConsultations[0].followUpDate).toLocaleDateString()}
                    </span>
                  </li>
                )}
                {healthData.medications
                  .filter((med) => {
                    const dueDate = new Date(med.refillDue)
                    const now = new Date()
                    const diffTime = dueDate.getTime() - now.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return diffDays <= 14
                  })
                  .map((med) => (
                    <li key={med.id} className="flex items-start gap-2">
                      <Pill className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        Refill {med.name} by {new Date(med.refillDue).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                {healthData.riskAssessments.filter((risk) => risk.riskLevel === "high").length > 0 && (
                  <li className="flex items-start gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Schedule consultation for high-risk conditions</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="risk" className="w-full">
        <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2 overflow-x-auto" : "grid-cols-4")}>
          <TabsTrigger value="risk">Disease Risk</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="progress">Health Progress</TabsTrigger>
          <TabsTrigger value="reports">Lab Reports</TabsTrigger>
        </TabsList>

        {/* Disease Risk Tab */}
        <TabsContent value="risk" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {healthData.riskAssessments.map((risk) => (
              <Card key={risk.id}>
                <CardHeader
                  className={`pb-2 ${
                    risk.riskLevel === "high"
                      ? "bg-red-50"
                      : risk.riskLevel === "medium"
                        ? "bg-amber-50"
                        : "bg-green-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <CardTitle>{risk.condition}</CardTitle>
                    <Badge
                      className={
                        risk.riskLevel === "high"
                          ? "bg-red-100 text-red-800"
                          : risk.riskLevel === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                      }
                    >
                      {risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)} Risk
                    </Badge>
                  </div>
                  <CardDescription>Risk Probability: {risk.probability}%</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {risk.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {risk.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Trend</span>
                      <div className="flex items-center">
                        {getTrendIcon(risk.trend)}
                        <span className="ml-1 capitalize">{risk.trend}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {healthData.chronicConditions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Chronic Condition Tracking</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {healthData.chronicConditions.map((condition) => (
                  <Card key={condition.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{condition.name}</CardTitle>
                        <Badge className={getBadgeColor(condition.status)}>{condition.status}</Badge>
                      </div>
                      <CardDescription>
                        Last assessed: {new Date(condition.lastAssessment).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Metrics:</h4>
                          <div className="space-y-2">
                            {condition.metrics.map((metric, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{metric.name}</span>
                                <div className="flex items-center">
                                  <span className="text-sm font-medium mr-2">{metric.value}</span>
                                  <Badge className={getBadgeColor(metric.change)}>
                                    {metric.change.charAt(0).toUpperCase() + metric.change.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Overall Trend</span>
                          <div className="flex items-center">
                            {getTrendIcon(condition.trend)}
                            <span className="ml-1 capitalize">{condition.trend}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Infection Probability Assessment</CardTitle>
              <CardDescription>Based on your reported symptoms and recent activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Significant Infection Risk Detected</h3>
                <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                  Based on your reported symptoms and recent medical history, we don't detect any significant risk of
                  infection at this time.
                </p>
                <Button variant="outline">Report New Symptoms</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {healthData.medications.map((med) => (
              <Card key={med.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{med.name}</CardTitle>
                    <Badge
                      className={med.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {med.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {med.dosage}, {med.frequency}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Started</span>
                        <span>{new Date(med.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next Refill Due</span>
                        <span>{new Date(med.refillDue).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Adherence</span>
                        <span className="text-sm font-medium">{med.adherence}%</span>
                      </div>
                      <Progress value={med.adherence} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {med.adherence >= 90
                          ? "Excellent adherence"
                          : med.adherence >= 80
                            ? "Good adherence"
                            : "Needs improvement"}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Set Reminder
                      </Button>
                      <Button variant="outline" size="sm">
                        Refill Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {healthData.interactions.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Medication Interaction Warnings</CardTitle>
                <CardDescription>Potential interactions between your medications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthData.interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          Interaction between {interaction.medications.join(" and ")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{interaction.description}</p>
                        <p className="text-sm font-medium mt-2">Recommendation: {interaction.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Medication Schedule</CardTitle>
              <CardDescription>Your daily medication schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-medium">Morning</div>
                  <div className="p-4 space-y-2">
                    {healthData.medications
                      .filter((med) => med.frequency.includes("daily") || med.frequency.includes("morning"))
                      .map((med) => (
                        <div key={med.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span>
                              {med.name} {med.dosage}
                            </span>
                          </div>
                          <Badge variant="outline">With breakfast</Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-medium">Evening</div>
                  <div className="p-4 space-y-2">
                    {healthData.medications
                      .filter((med) => med.frequency.includes("Twice") || med.frequency.includes("evening"))
                      .map((med) => (
                        <div key={med.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span>
                              {med.name} {med.dosage}
                            </span>
                          </div>
                          <Badge variant="outline">With dinner</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Progress Tab */}
        <TabsContent value="progress" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Health Progress Over Time</CardTitle>
                <CardDescription>Tracking your key health metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <LineChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Health trends chart would appear here</p>
                  <p className="text-sm">Showing data for the past {timeRange}</p>
                </div>
              </CardContent>
            </Card>

            {healthData.healthProgress.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{metric.metric}</CardTitle>
                  <CardDescription>
                    Current: {metric.current} | Target: {metric.target}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Previous</span>
                        <span>{metric.previous}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change</span>
                        <div className="flex items-center">
                          {getTrendIcon(metric.trend)}
                          <span className="ml-1 capitalize">{metric.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">History:</h4>
                      <div className="space-y-2">
                        {metric.history.map((reading, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{new Date(reading.date).toLocaleDateString()}</span>
                            <span>{reading.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Lifestyle Recommendations</CardTitle>
                <CardDescription>Based on your health trends and risk factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Increase Physical Activity</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on your improving blood pressure and glucose levels, we recommend continuing to increase
                        your physical activity to 30 minutes of moderate exercise at least 5 days per week.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Dietary Improvements</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your weight trend is positive. Continue reducing processed foods and sugars while increasing
                        fiber intake to help manage your pre-diabetes risk.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Stress Management</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Consider adding stress reduction techniques like meditation or deep breathing exercises to help
                        further improve your blood pressure readings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lab Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-4">
          {healthData.labReports.map((report, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{report.type}</CardTitle>
                  <Badge variant="outline">{new Date(report.date).toLocaleDateString()}</Badge>
                </div>
                <CardDescription>
                  {report.abnormalResults.length} abnormal results, {report.normalResults} normal results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.abnormalResults.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Abnormal Results:</h3>
                    <div className="space-y-2">
                      {report.abnormalResults.map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                          <div>
                            <span className="font-medium">{result.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">(Normal range: {result.range})</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{result.value}</span>
                            <Badge className="bg-red-100 text-red-800">{result.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    View Full Report
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare with Previous
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Recent Consultations</CardTitle>
              <CardDescription>Your recent doctor visits and diagnoses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData.recentConsultations.map((consult, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-medium flex justify-between items-center">
                      <span>{new Date(consult.date).toLocaleDateString()}</span>
                      <span className="text-sm">
                        {consult.doctor} ({consult.specialty})
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-sm font-medium">Primary Diagnosis</div>
                        <div className="text-sm">{consult.primaryDiagnosis}</div>
                      </div>
                      {consult.secondaryDiagnosis && (
                        <div>
                          <div className="text-sm font-medium">Secondary Diagnosis</div>
                          <div className="text-sm">{consult.secondaryDiagnosis}</div>
                        </div>
                      )}
                      {consult.followUpRecommended && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Calendar className="h-4 w-4" />
                          <span>Follow-up scheduled for {new Date(consult.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pdfError && (
        <div className="text-red-600 text-sm mt-2">
          {pdfError}
        </div>
      )}
    </div>
  )
}

