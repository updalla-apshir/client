"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider } from "react-hook-form"; // Import FormProvider
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema } from "shared/schemas/schema";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";


function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onsubmit = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("user", JSON.stringify(result.user));
        toast.success("Signed in successfully!");
        router.push("/");
      } else {
        const error = await response.json();
        toast.error(error.message || "Sign in failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // ... existing code ...

  const isFormValid =
    !form.formState.errors.email && !form.formState.errors.password;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onsubmit)}>
        <Card className="w-full sm:w-96 dark:bg-[#0e0c0b]">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Welcome back Please enter your credentials to continue.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email Address</Label>
                    <FormControl>
                      <Input type="email" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.email?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>Password</Label>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.password?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter>
            <div className="grid w-full gap-y-2">
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <Button variant="link" size="sm" disabled={isLoading}>
                <Link href="/sign-up">Don't have account? Sign Up</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}

export { SignInForm };