"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { User, CreditCard, Mail, Phone } from "lucide-react";
import RazorpayCheckout from "@/components/payment/RazorpayCheckout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentFormProps {
  onSuccess: (amount: number) => void;
  initialAmount?: string;
  userDetails?: {
    name: string;
    email: string;
    phone: string;
  };
}

const PaymentForm = ({ onSuccess, initialAmount = "", userDetails }: PaymentFormProps) => {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: userDetails?.name || "",
      email: userDetails?.email || "",
      phone: userDetails?.phone || "",
      amount: initialAmount,
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
    setCheckoutData(data);
  };

  const handlePaymentSuccess = (response: any) => {
    // Call the parent component's success handler with the amount
    onSuccess(parseFloat(checkoutData.amount));
    setCheckoutData(null); // Reset checkout data
  };

  return (
    <div className="space-y-4">
      {!checkoutData ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name
            </Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              className="mt-1"
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message?.toString()}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Invalid email address",
                },
              })}
              className="mt-1"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message?.toString()}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone", { required: "Phone number is required" })}
              className="mt-1"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message?.toString()}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="amount" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Amount (USD $)
            </Label>
            <Input
              id="amount"
              type="number"
              min={1}
              {...register("amount", {
                required: "Amount is required",
                min: {
                  value: 1,
                  message: "Amount must be at least $1",
                },
              })}
              className="mt-1"
              placeholder="Enter amount to add"
            />
            {errors.amount && (
              <p className="text-sm text-red-500 mt-1">{errors.amount.message?.toString()}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Continue to Payment
          </Button>
        </form>
      ) : (
        <RazorpayCheckout 
          data={checkoutData} 
          onSuccess={handlePaymentSuccess} 
        />
      )}
    </div>
  );
};

export default PaymentForm; 