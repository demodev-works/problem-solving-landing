"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, RotateCcw, BarChart3, User, CheckCircle, Facebook, Twitter, MessageCircle, ChevronDown } from "lucide-react"
import Image from "next/image"

// export const revalidate = 0;

export default function MoonpulLanding() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "" })
  const [isBusinessInfoOpen, setIsBusinessInfoOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send data to your backend
    console.log("Form submitted:", formData)
    setIsSuccess(true)
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setIsSuccess(false)
    setFormData({ name: "", email: "" })
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-28 lg:py-36 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-80" />
        <div className="absolute inset-0 bg-white/40" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-8">
            {/* Badge with animation */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3E64FF]/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-[#3E64FF]/20 animate-pulse">
              <span className="text-2xl">🚀</span>
              <span className="text-sm font-medium text-[#3E64FF]">곧 출시 예정</span>
            </div>
            
            {/* Main heading with gradient text */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                꿈을 현실로 만드는 편입 교육 서비스
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3E64FF] to-purple-600">
                메디컬 부스트
              </span>
            </h1>
            
            {/* Subheading with icon */}
            <div className="flex items-center justify-center gap-3 text-2xl md:text-3xl text-gray-700 font-light max-w-3xl mx-auto">
              <span className="text-[#3E64FF]">📚</span>
              <p>문제풀이 → 복습 → 암기까지, 한 번에 끝냅니다.</p>
              <span className="text-purple-600">✨</span>
            </div>
            
            {/* Content section with modern card design */}
            <div className="pt-16 space-y-8 max-w-5xl mx-auto">
              {/* Quote card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#3E64FF] to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-start gap-4">
                    <svg className="w-12 h-12 text-[#3E64FF]/20 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                    <p className="text-2xl md:text-2xl font-light text-gray-800 italic mt-2">
                      학생 중심의 맞춤형 편입 교육으로 꿈을 현실로 만듭니다
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Info cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#3E64FF]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-[#3E64FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">메디컬부스트란?</h3>
                      <p className="text-gray-600 leading-relaxed">
                        메디컬부스트는 한의대, 약대 편입을 꿈꾸는 학생들을 위한 전문 교육 서비스입니다.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">차별화된 솔루션</h3>
                      <p className="text-gray-600 leading-relaxed">
                        대형학원에서는 불가능한 개별 맞춤형 솔루션과 실질적인 피드백을 통해 학생들의 성공적인 편입을 지원합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature description */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-10 shadow-inner">
                <div className="max-w-3xl mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                    개인 맞춤형 교육의 새로운 기준
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed text-center">
                    메디컬부스트는 단순한 입시 정보 제공을 넘어서,
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed text-center">
                    학생 개개인의 상황과 목표에 최적화된 맞춤형 교육 솔루션을 제공합니다.
                  </p>
                  <div className="pt-6 flex justify-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
                      <svg className="w-5 h-5 text-[#3E64FF]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 font-medium">
                        학생이 정말 필요로 하는 것이 무엇인지 끊임없이 고민하고, 그것만을 정확히 제공하는 교육 서비스
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">핵심 기능</h2>
            <p className="text-lg text-gray-600">효율적인 학습을 위한 스마트한 기능들</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-2 hover:border-[#3E64FF]/30 transition-all duration-300 hover:shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-[#3E64FF]/10 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-[#3E64FF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">문제풀이</h3>
                <p className="text-gray-600">과목·단원별 맞춤 문제 제공</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-2 hover:border-[#FFAA00]/30 transition-all duration-300 hover:shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-[#FFAA00]/10 rounded-full flex items-center justify-center mx-auto">
                  <RotateCcw className="w-8 h-8 text-[#FFAA00]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">복습 시스템</h3>
                <p className="text-gray-600">틀린 문제 자동 저장 + 반복 복습</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-2 hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">학습 통계</h3>
                <p className="text-gray-600">진도율과 정확도를 그래프로 확인</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Usage Scenario Section */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">실제 사용 후기</h2>
            {/* <p className="text-lg text-gray-600">수험생이 문풀앱을 어떻게 활용하는지 살펴보세요</p> */}
          </div>

          <Card className="p-8 bg-gradient-to-r from-[#3E64FF]/5 to-[#FFAA00]/5 border-2 border-[#3E64FF]/20">
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#3E64FF] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">김수민 (수험생)</h3>
                  <p className="text-gray-600">편입 준비 중</p>
                </div>
              </div>

              <div className="space-y-4 pl-16">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#3E64FF] rounded-full mt-2"></div>
                  <p className="text-gray-700">매일 아침 전날 틀린 문제 복습을 할 수 있어 좋았습니다.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FFAA00] rounded-full mt-2"></div>
                  <p className="text-gray-700">오늘 학습 진도율 확인 후 부족한 과목에 집중할 수 있어 좋았어요.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full mt-2"></div>
                  <p className="text-gray-700">암기 기능을 이용해 취약 부분도 보안할 수 있어 만족스럽습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">무료인가요?</h3>
                <p className="text-gray-600">
                  합리적인 가격으로 모든 기능을 이용하실 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">어떤 시험에 사용할 수 있나요?</h3>
                <p className="text-gray-600">편입 시험에 활용 가능합니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer with Business Information */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="border-t border-gray-800 pt-8">
            {/* Business Info Toggle */}
            <div className="text-center mb-6">
              <button
                onClick={() => setIsBusinessInfoOpen(!isBusinessInfoOpen)}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span className="text-sm font-medium">사업자 정보</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isBusinessInfoOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            
            {/* Expandable Business Info */}
            <div
              className={`grid transition-all duration-300 overflow-hidden ${
                isBusinessInfoOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="bg-gray-800/50 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-gray-400">상호명</dt>
                      <dd className="text-gray-300">(주)스페이스브이</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-400">대표자</dt>
                      <dd className="text-gray-300">박형준</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-400">사업자 등록번호</dt>
                      <dd className="text-gray-300">886-81-01187</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-400">통신판매업 신고번호</dt>
                      <dd className="text-gray-300">2024-서울서초-0926</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-gray-400">주소</dt>
                      <dd className="text-gray-300">서울특별시 서초구 사평대로 53길 30, 602호</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Links */}
            <div className="flex justify-center items-center gap-4 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">
                이용약관
              </a>
              <span className="text-gray-600">|</span>
              <a href="#" className="hover:text-gray-300 transition-colors">
                개인정보 처리방침
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
  )
}
