
/**
 * 檢查餐廳目前是否營業。
 * 
 * @param openingHours - 營業時間字串，格式為 "HH:MM-HH:MM"。
 * @returns 如果目前在營業時間內，則返回 true，否則返回 false。
 * 
 * 注意：這是一個簡化的實作，假設：
 * 1. 營業時間每天都相同。
 * 2. 格式固定為 "HH:MM-HH:MM"。
 * 3. 不處理跨午夜的營業時間 (例如 22:00-02:00)。
 */
export function isRestaurantOpen(openingHours: string | null | undefined): boolean {
  if (!openingHours || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(openingHours)) {
    // 如果沒有提供營業時間或格式不對，視為無法判斷，當作符合條件（不過濾）
    return true;
  }

  try {
    const [startTime, endTime] = openingHours.split('-');
    const now = new Date();
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);

    // 簡單處理，不考慮跨天
    return now >= startDate && now <= endDate;
  } catch (error) {
    console.error("Error parsing opening hours:", error);
    return true; // 解析出錯時，不進行過濾
  }
}
