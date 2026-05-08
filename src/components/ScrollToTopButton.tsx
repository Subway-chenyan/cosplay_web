import React, { useState, useEffect } from 'react';
import { FaChevronUp } from 'react-icons/fa';
import styles from '../styles/ScrollToTopButton.module.css';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      // 当滚动超过300px时显示按钮
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);

    // 初始检查
    handleScroll();

    // 清理事件监听器
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 回到顶部的函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // 平滑滚动
    });
  };

  return (
    <button
      className={`${styles.scrollToTop} ${isVisible ? styles.visible : ''}`}
      onClick={scrollToTop}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <FaChevronUp />
    </button>
  );
};

export default ScrollToTopButton;