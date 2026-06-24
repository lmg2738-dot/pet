import Link from "next/link";
import {
  Camera,
  ClipboardList,
  Heart,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Camera,
    title: "사진 분석",
    description: "OpenRouter 무료 Vision 모델로 눈, 피부, 귀, 체형, 행동을 관찰합니다",
  },
  {
    icon: ClipboardList,
    title: "건강 기록",
    description: "체중, 예방접종, 메모를 체계적으로 관리합니다",
  },
  {
    icon: Sparkles,
    title: "건강 리포트",
    description: "주간·월간 분석 리포트로 건강 추이를 파악합니다",
  },
  {
    icon: Stethoscope,
    title: "병원 방문 권장",
    description: "이상 징후 발견 시 수의사 상담을 권장합니다",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-stone-50">
      <header className="border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
              <Heart className="h-5 w-5 text-amber-600" />
            </div>
            <span className="font-bold text-stone-900">PawInsight AI</span>
          </div>
          <Link href="/dashboard">
            <Button size="sm">시작하기</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
            <Shield className="h-4 w-4" />
            AI 반려동물 건강 도우미 · 진단 아님
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            사진 한 장으로
            <br />
            <span className="text-amber-600">반려동물 상태</span>를 분석하세요
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
            PawInsight AI는 강아지 사진을 분석하여 눈, 피부, 귀, 체형, 행동의
            건강 이상 여부를 알려드립니다. 건강 기록과 리포트로 반려동물 건강을
            꾸준히 관리하세요.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard/analyze">
              <Button size="lg">
                <Camera className="h-5 w-5" />
                건강 분석 시작
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                대시보드 보기
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-2xl font-bold text-stone-900">
              핵심 기능
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-stone-900">{title}</h3>
                  <p className="text-sm text-stone-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-relaxed text-amber-900">
              ⚠️ PawInsight AI는 수의학적 진단 서비스가 아닙니다. AI 분석 결과는
              참고용이며, 반려동물의 건강에 이상이 의심되면 반드시 수의사와
              상담하시기 바랍니다.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} PawInsight AI. All rights reserved.
      </footer>
    </div>
  );
}
