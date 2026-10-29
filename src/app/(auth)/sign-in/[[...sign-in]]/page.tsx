import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Member Sign In | Ironvale",
  description: "Sign in to your Ironvale athlete account to manage subscriptions and invoices.",
};

export default function SignInPage() {
  return (
    <SignIn
      fallbackRedirectUrl="/dashboard"
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
    />
  );
}

