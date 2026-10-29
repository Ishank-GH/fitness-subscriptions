import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Join Ironvale | Athlete Registration",
  description: "Create an account with Ironvale to choose your training block and start lifting.",
};

export default function SignUpPage() {
  return (
    <SignUp
      fallbackRedirectUrl="/dashboard"
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
    />
  );
}

