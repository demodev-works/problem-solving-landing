"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, RotateCcw, BarChart3, User, CheckCircle, Facebook, Twitter, MessageCircle } from "lucide-react"
import Image from "next/image"

export default function MoonpulLanding() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "" })

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
      <section className="relative px-4 py-16 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6 animate-fade-in">
            <Badge variant="secondary" className="bg-[#3E64FF]/10 text-[#3E64FF] border-[#3E64FF]/20">
              🚀 곧 출시 예정
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              수험생을 위한 똑똑한
              <br />
              <span className="text-[#3E64FF]">문제풀이 앱, 문풀앱</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              문제풀이 → 복습 → 암기까지, 한 번에 끝냅니다.
            </p>
            <div className="pt-8">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="bg-[#3E64FF] hover:bg-[#3E64FF]/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                🎉 출시 알림 받기
              </Button>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">실제 사용 시나리오</h2>
            <p className="text-lg text-gray-600">수험생이 문풀앱을 어떻게 활용하는지 살펴보세요</p>
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
                  <p className="text-gray-700">매일 아침 전날 틀린 문제 복습</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FFAA00] rounded-full mt-2"></div>
                  <p className="text-gray-700">오늘 학습 진도율 확인 후 부족한 과목에 집중</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full mt-2"></div>
                  <p className="text-gray-700">암기 기능을 이용해 취약 부분 보안하기</p>
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

            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">어떻게 알림을 받을 수 있나요?</h3>
                <p className="text-gray-600">이메일을 등록해주시면 출시 소식을 가장 먼저 알려드립니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 bg-gradient-to-r from-[#3E64FF] to-[#FFAA00]">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">지금 바로 알림을 신청하세요!</h2>
            <p className="text-xl opacity-90">출시되면 가장 먼저 알려드릴게요</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              variant="secondary"
              className="bg-white text-[#3E64FF] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              🚀 출시 알림 받기
            </Button>
          </div>
        </div>
      </section>

      {/* Email Collection Modal */}
      <Dialog open={isModalOpen} onOpenChange={resetModal}>
        <DialogContent className="sm:max-w-md">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold text-gray-900">출시 알림 신청</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    이름 (선택)
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름을 입력해주세요"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력해주세요"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#3E64FF] hover:bg-[#3E64FF]/90 text-white py-3 rounded-lg font-semibold"
                >
                  🚀 출시 시 가장 먼저 알려드릴게요!
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-[#10B981]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 신청 완료!</h3>
                <p className="text-gray-600">출시되면 가장 먼저 알려드릴게요.</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">📢 친구에게도 공유해보세요</p>
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                    <MessageCircle className="w-4 h-4" />
                    <span>카카오톡</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
