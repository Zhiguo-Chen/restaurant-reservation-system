import { Component, createSignal, Show } from "solid-js";
import { useAuth } from "../../hooks/useAuth";
import {
  useReservations,
  useCreateReservation,
  useReservationsByEmail,
} from "../../hooks/useReservations";
import { CreateReservationInput, ReservationStatus } from "../../types/graphql";

// 登录组件示例
export const LoginExample: Component = () => {
  const { login, logout, user, isAuthenticated, isLoading, loginError } =
    useAuth();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    try {
      await login({ username: username(), password: password() });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div class="p-4 border rounded">
      <h3 class="text-lg font-bold mb-4">认证示例</h3>

      <Show when={isLoading()}>
        <div>加载中...</div>
      </Show>

      <Show when={!isAuthenticated() && !isLoading()}>
        <form onSubmit={handleLogin} class="space-y-4">
          <div>
            <label class="block text-sm font-medium">用户名</label>
            <input
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              class="mt-1 block w-full border rounded px-3 py-2"
              placeholder="输入用户名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium">密码</label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="mt-1 block w-full border rounded px-3 py-2"
              placeholder="输入密码"
            />
          </div>
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            登录
          </button>
          <Show when={loginError()}>
            <div class="text-red-500 text-sm">{loginError()?.message}</div>
          </Show>
        </form>
      </Show>

      <Show when={isAuthenticated()}>
        <div class="space-y-2">
          <div>欢迎, {user()?.username}!</div>
          <div>角色: {user()?.role}</div>
          <button
            onClick={logout}
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            登出
          </button>
        </div>
      </Show>
    </div>
  );
};

// 预订列表组件示例
export const ReservationsExample: Component = () => {
  const { reservations, pagination, loading, error, refetch } = useReservations(
    {
      pagination: { limit: 10, offset: 0 },
    }
  );

  return (
    <div class="p-4 border rounded">
      <h3 class="text-lg font-bold mb-4">预订列表示例</h3>

      <div class="mb-4">
        <button
          onClick={() => refetch()}
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          刷新
        </button>
      </div>

      <Show when={loading()}>
        <div>加载中...</div>
      </Show>

      <Show when={error()}>
        <div class="text-red-500">错误: {error()?.message}</div>
      </Show>

      <Show when={reservations().length > 0}>
        <div class="space-y-2">
          {reservations().map((reservation) => (
            <div key={reservation.id} class="border p-3 rounded">
              <div class="font-medium">{reservation.guestName}</div>
              <div class="text-sm text-gray-600">
                {reservation.guestEmail} | {reservation.guestPhone}
              </div>
              <div class="text-sm">
                时间: {new Date(reservation.arrivalTime).toLocaleString()}
              </div>
              <div class="text-sm">
                人数: {reservation.tableSize} | 状态: {reservation.status}
              </div>
              <Show when={reservation.notes}>
                <div class="text-sm text-gray-500">
                  备注: {reservation.notes}
                </div>
              </Show>
            </div>
          ))}
        </div>

        <Show when={pagination()}>
          <div class="mt-4 text-sm text-gray-600">
            总计: {pagination()?.total} | 显示: {pagination()?.offset + 1}-
            {Math.min(
              (pagination()?.offset || 0) + (pagination()?.limit || 0),
              pagination()?.total || 0
            )}
          </div>
        </Show>
      </Show>

      <Show when={!loading() && reservations().length === 0}>
        <div class="text-gray-500">暂无预订记录</div>
      </Show>
    </div>
  );
};

// 创建预订组件示例
export const CreateReservationExample: Component = () => {
  const { createReservation, loading, error } = useCreateReservation();

  const [formData, setFormData] = createSignal<CreateReservationInput>({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    arrivalTime: "",
    tableSize: 2,
    notes: "",
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await createReservation(formData());
      // 重置表单
      setFormData({
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        arrivalTime: "",
        tableSize: 2,
        notes: "",
      });
      alert("预订创建成功！");
    } catch (error) {
      console.error("创建预订失败:", error);
    }
  };

  const updateField = (field: keyof CreateReservationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div class="p-4 border rounded">
      <h3 class="text-lg font-bold mb-4">创建预订示例</h3>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label class="block text-sm font-medium">客人姓名</label>
          <input
            type="text"
            value={formData().guestName}
            onInput={(e) => updateField("guestName", e.currentTarget.value)}
            class="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium">电话</label>
          <input
            type="tel"
            value={formData().guestPhone}
            onInput={(e) => updateField("guestPhone", e.currentTarget.value)}
            class="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium">邮箱</label>
          <input
            type="email"
            value={formData().guestEmail}
            onInput={(e) => updateField("guestEmail", e.currentTarget.value)}
            class="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium">到达时间</label>
          <input
            type="datetime-local"
            value={formData().arrivalTime}
            onInput={(e) => updateField("arrivalTime", e.currentTarget.value)}
            class="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium">人数</label>
          <input
            type="number"
            min="1"
            max="20"
            value={formData().tableSize}
            onInput={(e) =>
              updateField("tableSize", parseInt(e.currentTarget.value))
            }
            class="mt-1 block w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium">备注</label>
          <textarea
            value={formData().notes}
            onInput={(e) => updateField("notes", e.currentTarget.value)}
            class="mt-1 block w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={loading()}
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading() ? "创建中..." : "创建预订"}
        </button>

        <Show when={error()}>
          <div class="text-red-500 text-sm">{error()?.message}</div>
        </Show>
      </form>
    </div>
  );
};

// 根据邮箱查询预订示例
export const ReservationsByEmailExample: Component = () => {
  const { getReservationsByEmail, reservations, loading, error } =
    useReservationsByEmail();
  const [email, setEmail] = createSignal("");

  const handleSearch = async (e: Event) => {
    e.preventDefault();
    if (email()) {
      try {
        await getReservationsByEmail(email());
      } catch (error) {
        console.error("查询失败:", error);
      }
    }
  };

  return (
    <div class="p-4 border rounded">
      <h3 class="text-lg font-bold mb-4">根据邮箱查询预订示例</h3>

      <form onSubmit={handleSearch} class="mb-4">
        <div class="flex gap-2">
          <input
            type="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            placeholder="输入邮箱地址"
            class="flex-1 border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={loading()}
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading() ? "查询中..." : "查询"}
          </button>
        </div>
      </form>

      <Show when={error()}>
        <div class="text-red-500 mb-4">错误: {error()?.message}</div>
      </Show>

      <Show when={reservations().length > 0}>
        <div class="space-y-2">
          {reservations().map((reservation) => (
            <div key={reservation.id} class="border p-3 rounded">
              <div class="font-medium">{reservation.guestName}</div>
              <div class="text-sm">
                时间: {new Date(reservation.arrivalTime).toLocaleString()}
              </div>
              <div class="text-sm">
                人数: {reservation.tableSize} | 状态: {reservation.status}
              </div>
            </div>
          ))}
        </div>
      </Show>

      <Show when={!loading() && reservations().length === 0 && email()}>
        <div class="text-gray-500">未找到相关预订记录</div>
      </Show>
    </div>
  );
};
