import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

// Android notification light color (matches theme primary)
const NOTIFICATION_LIGHT_COLOR = '#f97316'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface PushNotificationState {
  expoPushToken: string | null
  notification: Notifications.Notification | null
  error: string | null
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notifications.Notification | null>(null)
  const [error, setError] = useState<string | null>(null)

  const notificationListener = useRef<Notifications.Subscription>(undefined)
  const responseListener = useRef<Notifications.Subscription>(undefined)

  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      setError('推播通知需要在實體裝置上使用')
      return null
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        setError('未授予推播通知權限')
        return null
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      setExpoPushToken(token.data)

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: NOTIFICATION_LIGHT_COLOR,
        })
      }

      return token.data
    } catch (err) {
      setError('無法註冊推播通知')
      return null
    }
  }, [])

  useEffect(() => {
    registerForPushNotifications()

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification)
      }
    )

    // Listen for notification responses (user taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data
        // Handle navigation based on notification data
        if (data?.restaurantId) {
          // Navigate to restaurant - handled by the app
        }
      }
    )

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [registerForPushNotifications])

  return {
    expoPushToken,
    notification,
    error,
    registerForPushNotifications,
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger ?? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
  })
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// Get notification permissions status
export async function getNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}
