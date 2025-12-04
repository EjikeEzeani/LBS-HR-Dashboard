import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/:employeeNumber", async (req, res) => {
  const { employeeNumber } = req.params
  const employee = await db("employees").where({ employee_number: employeeNumber }).first()

  if (!employee) {
    return res.status(404).json({ success: false, error: "not_found" })
  }

  const leaves = await db("leave_records").where({ employee_number: employeeNumber }).orderBy("start_date", "desc").limit(10)
  const training = await db("training_records").where({ employee_number: employeeNumber }).orderBy("start_date", "desc").limit(10)

  return res.json({
    ...employee,
    leaves,
    training,
  })
})

export default router

