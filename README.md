# voice-chat-rooms-

# socketIO is used as open connection 


# 🚀 Socket.io API Documentation

## 1️⃣ إدارة الغرف (Room Management)
| الحدث (Event) | الجهة | البيانات (Payload) | الوصف |
| :--- | :---: | :--- | :--- |
| `join-room` | 📱 Client | `roomID` | طلب انضمام لغرفة |
| `room-joined` | 💻 Server | `{success, room, messages}` | تأكيد الدخول وإرسال البيانات |
| `user-joined` | 💻 Server | `{userName, participants}` | تنبيه الأعضاء بدخول مستخدم جديد |
| `leave-Room` | 📱 Client | `roomID` | طلب مغادرة الغرفة |
| `room-left` | 💻 Server | `{success, message}` | تأكيد الخروج للعميل |

---

## 2️⃣ المراسلات (Chat Module)
| الحدث (Event) | الجهة | البيانات (Payload) | الوصف |
| :--- | :---: | :--- | :--- |
| `send-message` | 📱 Client | `{message, messageType, roomID}` | إرسال رسالة نصية أو ملف |
| `new-message` | 💻 Server | `{MassageID, userName, message}` | بث الرسالة لجميع أعضاء الغرفة |

---

## 3️⃣ الصلاحيات الصوتية (Voice Access)
| الحدث (Event) | الجهة | البيانات (Payload) | الوصف |
| :--- | :---: | :--- | :--- |
| `request-voice-access` | 📱 Client | `roomID` | طلب تصريح للتحدث |
| `voice-access-granted` | 💻 Server | `{success, currentParticipants}` | الموافقة وفتح الميكروفون للعميل |
| `user-joined-voice` | 💻 Server | `{userId, username, isMuted}` | تنبيه الغرفة بأن العميل أصبح متحدثاً |

---

## 4️⃣ البث والحالة الصوتية (Streaming)
| الحدث (Event) | الجهة | البيانات (Payload) | الوصف |
| :--- | :---: | :--- | :--- |
| `toggle-microphone` | 📱 Client | `{roomID, userID, isMuted}` | كتم أو تفعيل الميكروفون |
| `speaking-Status` | 📱 Client | `{roomID, userID, isSpeaking}` | إرسال حالة التحدث (توهج الأيقونة) |
| `voice-data` | 📱 Client | `{roomID, userID, audioData}` | إرسال Stream الصوت الخام |
| `voice-data` | 💻 Server | `{userId, audioData}` | توزيع الصوت على المستمعين |
