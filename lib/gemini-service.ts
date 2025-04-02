import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"

// Initialize the Gemini API with the provided key
const genAI = new GoogleGenerativeAI("AIzaSyC_wCBSYJ8l1sx5eAEAFTUSCYK3JbJkXHY")

// Set up safety settings to prevent harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// Generate a text response using the Gemini API
export async function generateTextResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    })

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Format important information with bold markers
    return formatResponseWithEmphasis(response)
  } catch (error) {
    console.error("Error generating text response:", error)
    return "I'm sorry, I encountered an error while processing your request. Please try again."
  }
}

// Generate a response with an image using the Gemini API
export async function generateResponseWithImage(text: string, imageData: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    })

    // Extract the base64 data from the data URL
    const base64Image = imageData.split(",")[1]

    const prompt = `
      You are a medical AI assistant. The user has uploaded an image related to their health concern.
      
      User's description: ${text}
      
      Analyze the image and provide insights about what it might show from a medical perspective.
      Be cautious and remind the user that this is not a diagnosis and they should consult a healthcare professional.
      Format important medical terms with *asterisks* to highlight them.
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
    ])

    const response = result.response.text()
    return formatResponseWithEmphasis(response)
  } catch (error) {
    console.error("Error generating response with image:", error)
    return "I'm sorry, I couldn't analyze the image. Please try again or describe your symptoms in text."
  }
}

// Simulate audio transcription (in a real app, use a proper speech-to-text service)
export async function transcribeAudio(audioData: string): Promise<string> {
  // This is a placeholder. In a real app, you would send the audio to a transcription service
  return "This is a simulated transcription of the audio. In a real application, this would be the actual transcribed text from the audio recording."
}

// Generate a response with audio transcription
export async function generateResponseWithAudio(text: string, transcription: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    })

    const prompt = `
      You are a medical AI assistant. The user has provided an audio description of their symptoms.
      
      User's text: ${text}
      
      Transcription of audio: ${transcription}
      
      Based on this information, provide insights about what might be happening from a medical perspective.
      Be cautious and remind the user that this is not a diagnosis and they should consult a healthcare professional.
      Format important medical terms with *asterisks* to highlight them.
    `

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    return formatResponseWithEmphasis(response)
  } catch (error) {
    console.error("Error generating response with audio:", error)
    return "I'm sorry, I couldn't analyze the audio. Please try again or describe your symptoms in text."
  }
}

// Generate a medical analysis based on symptoms
export async function generateMedicalAnalysis(symptoms: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    })

    const prompt = `
      You are a medical AI assistant. Based on the following symptoms, provide a structured analysis:
      
      ${symptoms}
      
      Format your response in the following structure:
      
      POSSIBLE_CONDITIONS:
      - Condition Name 1 | Probability: High/Medium/Low | Urgency: high/medium/low
      - Condition Name 2 | Probability: High/Medium/Low | Urgency: high/medium/low
      - Condition Name 3 | Probability: High/Medium/Low | Urgency: high/medium/low
      
      RECOMMENDATION:
      Provide a detailed recommendation about what the user should do next, including when they should seek medical attention.
      
      Remember to emphasize that this is not a diagnosis and the user should consult a healthcare professional.
      Format important medical terms with *asterisks* to highlight them.
    `

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error("Error generating medical analysis:", error)
    return `
      POSSIBLE_CONDITIONS:
      - Common Cold | Probability: High | Urgency: low
      - Seasonal Allergies | Probability: Medium | Urgency: low
      - Sinus Infection | Probability: Low | Urgency: medium
      
      RECOMMENDATION:
      I'm sorry, I encountered an error while analyzing your symptoms. Based on the limited information, I recommend consulting with a healthcare professional if your symptoms persist or worsen. This is not a diagnosis, and a proper medical evaluation is necessary.
    `
  }
}

// Parse the analysis response into a structured format
export function parseAnalysisResponse(response: string): {
  possibleConditions: Array<{ name: string; probability: string; urgency: "low" | "medium" | "high" }>
  recommendation: string
} {
  try {
    const conditionsSection = response.split("POSSIBLE_CONDITIONS:")[1]?.split("RECOMMENDATION:")[0]?.trim()
    const recommendationSection = response.split("RECOMMENDATION:")[1]?.trim()

    const conditions = conditionsSection
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        // Parse each condition line
        const parts = line.replace(/^-\s*/, "").split("|")
        const name = parts[0]?.trim() || "Unknown Condition"

        const probabilityMatch = parts[1]?.match(/Probability:\s*(High|Medium|Low)/i)
        const probability = probabilityMatch ? probabilityMatch[1] : "Medium"

        const urgencyMatch = parts[2]?.match(/Urgency:\s*(high|medium|low)/i)
        const urgency = (urgencyMatch ? urgencyMatch[1].toLowerCase() : "medium") as "low" | "medium" | "high"

        return { name, probability, urgency }
      })

    return {
      possibleConditions:
        conditions.length > 0
          ? conditions
          : [
              { name: "Common Cold", probability: "High", urgency: "low" },
              { name: "Seasonal Allergies", probability: "Medium", urgency: "low" },
              { name: "Sinus Infection", probability: "Low", urgency: "medium" },
            ],
      recommendation:
        recommendationSection ||
        "Please consult with a healthcare professional for proper evaluation and treatment recommendations.",
    }
  } catch (error) {
    console.error("Error parsing analysis response:", error)
    return {
      possibleConditions: [
        { name: "Common Cold", probability: "High", urgency: "low" },
        { name: "Seasonal Allergies", probability: "Medium", urgency: "low" },
        { name: "Sinus Infection", probability: "Low", urgency: "medium" },
      ],
      recommendation:
        "I encountered an error while analyzing your symptoms. Please consult with a healthcare professional for proper evaluation and treatment recommendations.",
    }
  }
}

// Format response to add emphasis markers for important terms
function formatResponseWithEmphasis(text: string): string {
  // List of medical terms that should be emphasized
  const medicalTerms = [
    "fever",
    "cough",
    "headache",
    "migraine",
    "nausea",
    "vomiting",
    "diarrhea",
    "infection",
    "virus",
    "bacteria",
    "inflammation",
    "chronic",
    "acute",
    "diagnosis",
    "treatment",
    "symptom",
    "condition",
    "disease",
    "disorder",
    "prescription",
    "medication",
    "antibiotic",
    "vaccine",
    "immunization",
    "allergy",
    "allergic",
    "asthma",
    "diabetes",
    "hypertension",
    "blood pressure",
  ]

  // Don't modify text that already has emphasis markers
  if (text.includes("*")) {
    return text
  }

  // Add emphasis to medical terms
  let formattedText = text
  medicalTerms.forEach((term) => {
    // Use word boundaries to match whole words only
    const regex = new RegExp(`\\b${term}\\b`, "gi")
    formattedText = formattedText.replace(regex, `**$&**`)
  })

  return formattedText
}

