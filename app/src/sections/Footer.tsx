import { motion } from 'framer-motion';
import { AlertCircle, ExternalLink, Heart } from 'lucide-react';

const friendLinks = [
  {
    title: '多多共享id',
    url: '/',
  },
  {
    title: '多多发卡',
    url: 'https://duoduo.uk',
  },
  {
    title: '联系交换友链',
    url: 'mailto:admin@id.duoduo.uk',
  },
];

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-16 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Disclaimer */}
        <div className="apple-card p-6 mb-8 bg-gray-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                免责声明
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                本网站提供的账号仅供学习和测试使用，请勿用于非法用途。使用共享账号存在风险，请自行承担使用后果。建议购买正版账号以获得更好的服务体验。
              </p>
            </div>
          </div>
        </div>

        {/* Friend Links */}
        <div className="border-y border-gray-100 py-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              友情链接
            </h4>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {friendLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.url}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                >
                  {link.title}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>by 多多共享id</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 多多共享id账号共享平台. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
