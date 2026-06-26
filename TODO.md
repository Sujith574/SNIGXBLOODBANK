# TODO - Blood Bank Management System (MERN)

## Phase 0: Bootstrap
- [ ] Initialize monorepo structure: `frontend/` (Vite+React+Tailwind) and `backend/` (Express+Mongoose)
- [ ] Add root README + `.env.example` templates

## Phase 1: Backend Production Baseline (Auth first)
- [ ] Setup server config: dotenv, helmet, cors, rate limiter, logging
- [ ] Setup Mongo connection + Mongoose models
- [ ] Implement MVC scaffolding (models/controllers/routes/middlewares/services/config/utils/uploads)
- [ ] Implement Auth:
  - [ ] Registration + email validation
  - [ ] Login + JWT
  - [ ] Logout
  - [ ] Forgot password + reset
  - [ ] Password rules validation
  - [ ] Remember-login strategy (token/device optional)
  - [ ] Role-based access (Admin/Donor/Hospital)
- [ ] Implement profile image upload with Multer
- [ ] Implement global error handler + API response format

## Phase 2: Frontend Production Baseline
- [ ] Setup React Router + protected routes + role gates
- [ ] Auth context + Axios interceptor
- [ ] UI: Landing page + Login/Register pages
- [ ] React Hook Form validations mirroring server rules

## Phase 3: Modules
- [ ] Admin dashboard + donor/hospital/inventory/request endpoints
- [ ] Donor portal (profile, history, eligibility, appointments)
- [ ] Hospital portal (requests, tracking)
- [ ] Inventory automation (expiry/low stock)
- [ ] Donations + certificate generation
- [ ] Matching compatibility checker
- [ ] Eligibility engine
- [ ] Camps management + participant registration
- [ ] Notifications + reports + exports + global search

## Phase 4: Seed Data + Docs
- [ ] Seed initial roles/users and blood inventory
- [ ] Provide API docs (Swagger) and complete installation steps
- [ ] Ensure `npm run dev` for frontend and backend works

