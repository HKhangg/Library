'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Star, Check, MessageCircle } from 'lucide-react';

function BookReview() {
  return (
    <div className="border rounded-md p-4 space-y-4 bg-blue-50 dark:bg-gray-800 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <Tabs defaultValue="review">
        {/* Thanh Tabs */}
        <TabsList className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="review"
            className="cursor-pointer px-4 py-2 rounded-t-md text-gray-700 dark:text-gray-200 
              data-[state=active]:bg-[#9ce5f4] data-[state=active]:text-blue-900 
              dark:data-[state=active]:text-white data-[state=active]:font-roboto font-bold
              transition-colors duration-200"
          >
            Đánh giá
          </TabsTrigger>
          <TabsTrigger
            value="question"
            className="cursor-pointer px-4 py-2 rounded-t-md text-gray-700 dark:text-gray-200 
              data-[state=active]:bg-[#9ce5f4] data-[state=active]:text-blue-900 
              dark:data-[state=active]:text-white data-[state=active]:font-roboto font-bold
              transition-colors duration-200"
          >
            Câu hỏi & Trả lời
          </TabsTrigger>
        </TabsList>


        <TabsContent value="review" className="mt-4">
          <p className="font-bold text-xl text-gray-900 dark:text-gray-100">Đánh giá</p>

          <div className="flex gap-1 text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="stroke-current" fill="none" />
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dựa trên 0 đánh giá</p>

          <hr className="border-t border-gray-200 dark:border-gray-700 my-4" />

          <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 transition">
            <Check className="w-5 h-5 text-green-500" />
            <span>Viết đánh giá</span>
          </button>
        </TabsContent>

        <TabsContent value="question" className="mt-4">
          <p className="font-bold text-xl text-gray-900 dark:text-gray-100">Câu hỏi & Trả lời</p>
          <p className="text-gray-500 dark:text-gray-400">Hiện chưa có câu hỏi nào.</p>

          <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 mt-4 transition">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <span>Đặt câu hỏi</span>
          </button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BookReview;
