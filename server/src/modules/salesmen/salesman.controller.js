import * as salesmanService from './salesman.service.js'

export const createSalesman = async (req, res, next) => {
  try {
    const salesman = await salesmanService.createSalesman(req.user.id, req.body)
    return res.status(201).json({ success: true, message: 'Salesman added successfully.', salesman })
  } catch (err) { next(err) }
}

export const getSalesmen = async (req, res, next) => {
  try {
    const result = await salesmanService.getSalesmen(req.user, req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const getSalesman = async (req, res, next) => {
  try {
    const salesman = await salesmanService.getSalesmanById(req.params.id, req.user.id)
    return res.status(200).json({ success: true, salesman })
  } catch (err) { next(err) }
}

export const updateSalesman = async (req, res, next) => {
  try {
    const salesman = await salesmanService.updateSalesman(req.params.id, req.user.id, req.body)
    return res.status(200).json({ success: true, message: 'Salesman updated.', salesman })
  } catch (err) { next(err) }
}

export const deleteSalesman = async (req, res, next) => {
  try {
    await salesmanService.deleteSalesman(req.params.id, req.user.id)
    return res.status(200).json({ success: true, message: 'Salesman deactivated.' })
  } catch (err) { next(err) }
}
