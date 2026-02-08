import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'hidden', // Hide OAuth buttons
              socialButtonsBlockButtonText: 'hidden',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-400',
              formButtonPrimary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
              formFieldInput: 'bg-white/5 border-white/10 text-white',
              formFieldLabel: 'text-gray-300',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-indigo-400',
              formResendCodeLink: 'text-indigo-400 hover:text-indigo-300',
              otpCodeFieldInput: 'bg-white/5 border-white/10 text-white',
            },
            layout: {
              socialButtonsPlacement: 'bottom',
              socialButtonsVariant: 'iconButton',
            },
          }}
        />
      </div>
    </div>
  )
}
