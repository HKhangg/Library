"use client";

import React from "react";
import { motion } from "framer-motion";
import { Folder, BookOpen } from "lucide-react";

export default function CategorySidebar({
  categories = [],
  childrenMap = {},
  activeParentId,
  activeChildId,
  onParentClick,
  onChildClick,
  topOffset = "top-16",
}) {
  const currentChildList = activeParentId ? childrenMap[activeParentId] || [] : [];

  return (
    <motion.aside
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`sticky ${topOffset} self-start ml-10 w-64 rounded-3xl`} 
      aria-label="Sidebar thể loại"
    >
      <div
        className="
          bg-blue-50 dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 
          rounded-3xl shadow-md
          p-4
          overflow-y-auto
          max-h-[calc(100vh-6rem)]
          z-20
        "
      >
        <h3 className="flex items-center gap-2 text-lg font-roboto font-bold mb-4 text-gray-900 dark:text-gray-100">
          <Folder className="w-5 h-5 text-[#30c9e8]" />
          Danh mục
        </h3>

        <ul>
          {/* Tất cả */}
          <li className="mb-2">
            <button
              onClick={() => onParentClick(null)}
              className={`w-full text-left font-roboto font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeParentId === null && activeChildId === null
                  ? "bg-[#66d7ee] text-white"
                  : "text-gray-700 dark:text-gray-200 hover:text-[#30c9e8] dark:hover:text-[#30c9e8] hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Tất cả
            </button>
          </li>

          {categories.map((cat) => (
            <li key={cat.id} className="mb-2">
              <button
                onClick={() => onParentClick(cat.id)}
                className={`w-full flex justify-between font-roboto font-bold items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeParentId === cat.id
                    ? "bg-[#66d7ee] text-white"
                    : "text-gray-700 dark:text-gray-200 hover:text-[#30c9e8] dark:hover:text-[#30c9e8] hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="w-4 h-4" />
                  {cat.name}
                </span>
                <span className="text-sm text-gray-400">
                  ({cat.soLuongDanhMuc ?? 0})
                </span>
              </button>

              {activeParentId === cat.id && currentChildList.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="ml-4 mt-2 border-l border-gray-200 dark:border-gray-600 pl-3"
                >
                  {currentChildList.map((child) => (
                    <li key={child.id} className="mb-1">
                      <button
                        onClick={() => onChildClick(child.id)}
                        className={`w-full font-roboto text-left px-2 py-1 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 ${
                          activeChildId === child.id
                            ? "bg-[#30c9e8] text-white"
                            : "text-gray-700 dark:text-gray-200 hover:text-[#30c9e8] dark:hover:text-[#30c9e8] hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {child.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}
