import { Category, NewsItem, Briefing } from './types';

export const CATEGORIES = Object.values(Category);

export const INITIAL_BRIEFING: Briefing = {
  date: new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  highlights: [
    "Thị trường căn hộ TP.HCM ghi nhận nguồn cung giảm 50% trong Q1/2024, đẩy giá sơ cấp tăng nhẹ.",
    "Luật Đất đai sửa đổi chính thức có hiệu lực, tác động mạnh đến quy trình đền bù giải tỏa.",
    "Xu hướng ứng dụng AI trong định giá nhà đất đang được các PropTech Việt Nam đẩy mạnh triển khai."
  ]
};

// Fallback data if API is not set or fails
export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Giá chung cư Hà Nội tiếp tục lập đỉnh mới trong tháng 5',
    source: 'VnExpress',
    timeAgo: '2 giờ trước',
    category: Category.MARKET_PRICE,
    summaryPoints: [
      "Giá trung bình căn hộ sơ cấp đạt 58 triệu đồng/m2.",
      "Nguồn cung khan hiếm tại các quận trung tâm đẩy giá vùng ven tăng theo.",
      "Giao dịch tập trung chủ yếu ở phân khúc 3-5 tỷ đồng."
    ],
    url: '#',
    insight: 'Dòng tiền đang dịch chuyển mạnh về phía Bắc do mặt bằng giá TP.HCM đã quá cao.',
    opportunity: 'Cơ hội chốt lời cho nhà đầu tư trung hạn đã mua từ 2022.',
    risk: 'Rủi ro thanh khoản nếu thị trường bước vào giai đoạn đi ngang sau đợt tăng nóng.'
  },
  {
    id: '2',
    title: 'Ứng dụng AI giúp môi giới BĐS chốt khách nhanh gấp 3 lần',
    source: 'Cafef',
    timeAgo: '4 giờ trước',
    category: Category.PROPTECH_AI,
    summaryPoints: [
      "Công cụ AI tự động lọc khách hàng tiềm năng từ dữ liệu lớn.",
      "Chatbot AI hỗ trợ tư vấn sơ bộ 24/7, giảm tải cho nhân sự.",
      "Tự động tạo video listing nhà ảo giúp khách xem nhà từ xa."
    ],
    url: '#',
    insight: 'Chuyển đổi số không còn là lựa chọn mà là yêu cầu bắt buộc để cạnh tranh.',
    opportunity: 'Đầu tư vào các nền tảng PropTech cung cấp giải pháp SaaS B2B.',
    risk: 'Chi phí triển khai ban đầu cao, rào cản công nghệ với nhân sự lớn tuổi.'
  },
  {
    id: '3',
    title: 'Cảnh báo sạt lở tại các khu nghỉ dưỡng đồi núi phía Bắc',
    source: 'Báo Tài Nguyên & Môi Trường',
    timeAgo: '1 giờ trước',
    category: Category.DISASTER_RISK,
    summaryPoints: [
      "Mùa mưa đến sớm, nguy cơ sạt lở cao tại Sapa, Hà Giang.",
      "Nhiều homestay xây dựng trái phép trên nền đất yếu.",
      "Chính quyền địa phương bắt đầu rà soát và yêu cầu dừng hoạt động các cơ sở không an toàn."
    ],
    url: '#',
    insight: 'Biến đổi khí hậu đang tác động trực tiếp đến giá trị và khả năng khai thác của BĐS nghỉ dưỡng núi.',
    opportunity: 'Tìm kiếm các khu vực có hạ tầng kè chắn tốt, pháp lý an toàn.',
    risk: 'Rủi ro pháp lý và mất trắng tài sản nếu nằm trong vùng quy hoạch sạt lở.'
  },
  {
    id: '4',
    title: 'Báo cáo thị trường BĐS công nghiệp Q2: Tỷ lệ lấp đầy đạt 85%',
    source: 'Savills Vietnam',
    timeAgo: '30 phút trước',
    category: Category.DATA_REPORT,
    summaryPoints: [
      "Giá thuê đất KCN miền Bắc tăng 10% so với cùng kỳ.",
      "Dòng vốn FDI tiếp tục chảy mạnh vào Bắc Ninh, Hải Phòng.",
      "Nhu cầu nhà xưởng xây sẵn (RBF) tăng đột biến."
    ],
    url: '#'
  },
  {
    id: '5',
    title: 'Dự thảo nghị định mới về condotel: Gỡ vướng pháp lý sổ hồng',
    source: 'Tuổi Trẻ',
    timeAgo: '5 giờ trước',
    category: Category.POLICY_LEGAL,
    summaryPoints: [
      "Quy định rõ ràng hơn về cấp giấy chứng nhận quyền sở hữu cho condotel.",
      "Xác định thời hạn sở hữu theo thời hạn dự án (thường là 50 năm).",
      "Kỳ vọng khơi thông dòng vốn đang 'đóng băng' tại phân khúc nghỉ dưỡng."
    ],
    url: '#'
  }
];
