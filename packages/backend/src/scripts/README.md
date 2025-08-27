# 数据库脚本说明

## 文件说明

### `employees.json`

员工数据文件，包含所有员工的基本信息：

- `id`: 员工唯一标识
- `username`: 登录用户名
- `email`: 邮箱地址
- `role`: 角色 (ADMIN/EMPLOYEE)
- `firstName`: 名字
- `lastName`: 姓氏
- `phone`: 电话号码

### `seed-employees.js`

员工数据同步脚本，读取 `employees.json` 文件并将数据同步到数据库。

### `seed.js`

完整的数据库初始化脚本，包含员工和预订示例数据。

## 使用方法

### 1. 仅同步员工数据

```bash
# 在项目根目录
make seed-employees

# 或者在 backend 目录
npm run seed:employees
```

### 2. 完整数据初始化

```bash
# 在项目根目录
make seed

# 或者在 backend 目录
npm run seed
```

## 修改员工数据

1. 编辑 `employees.json` 文件
2. 添加、修改或删除员工信息
3. 运行 `make seed-employees` 同步到数据库

## 默认密码

所有员工的默认密码都是：`employee123`

## 注意事项

- 确保 Couchbase 服务已启动
- 脚本会自动创建新员工或更新现有员工
- 员工 ID 不能重复
- 角色只能是 ADMIN 或 EMPLOYEE
