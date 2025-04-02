"use client";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface CheckoutProps {
  data: {
    name: string;
    email: string;
    phone: string;
    amount: string;
  };
  onSuccess: (response: any) => void;
}

const RazorpayCheckout = ({ data, onSuccess }: CheckoutProps) => {
  useEffect(() => {
    // Load the Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: parseFloat(data.amount) * 100, // Convert to smallest currency unit
        currency: "INR",
        name: "Healthcare Platform",
        description: "Add funds to healthcare wallet",
        image: "/logo.png", // Replace with your logo
        handler: function (response: any) {
          console.log("Payment successful:", response);
          onSuccess(response);
        },
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        theme: {
          color: "#16a34a", // Green color
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed");
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    };

    return () => {
      // Cleanup the script when component unmounts
      document.body.removeChild(script);
    };
  }, [data, onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
      <p className="text-center text-muted-foreground">
        Initializing payment gateway...
      </p>
      <p className="text-center text-sm text-muted-foreground mt-2">
        You'll be redirected to the secure payment page
      </p>
    </div>
  );
};

export default RazorpayCheckout; 