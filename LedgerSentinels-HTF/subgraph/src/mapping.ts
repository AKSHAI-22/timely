import { BigInt, Address } from '@graphprotocol/graph-ts'
import {
    SlotCreated as SlotCreatedEvent,
    SlotBooked as SlotBookedEvent,
    SlotRevoked as SlotRevokedEvent,
    SlotResold as SlotResoldEvent,
    ExpertProfileUpdated as ExpertProfileUpdatedEvent,
    SlotAutoRevoked as SlotAutoRevokedEvent
} from '../generated/TimeSlotNFT/TimeSlotNFT'

import { TimeSlot, ExpertProfile, Booking } from '../generated/schema'

export function handleSlotCreated(event: SlotCreatedEvent): void {
    let id = event.params.tokenId.toString()
    let slot = new TimeSlot(id)
    slot.tokenId = event.params.tokenId
    slot.expert = event.params.expert
    slot.startTime = event.params.startTime
    slot.endTime = event.params.endTime
    slot.price = event.params.price
    slot.isBooked = false
    slot.bookedBy = null
    slot.isRevoked = false
    slot.profession = event.params.profession
    slot.description = ''
    slot.createdAt = event.block.timestamp
    slot.save()
}

export function handleSlotBooked(event: SlotBookedEvent): void {
    let id = event.params.tokenId.toString()
    let slot = TimeSlot.load(id)
    if (slot == null) return
    slot.isBooked = true
    slot.bookedBy = event.params.booker
    slot.save()

    let booking = new Booking(event.transaction.hash.toHex() + '-' + id)
    booking.slot = id
    booking.expert = event.params.expert
    booking.customer = event.params.booker
    booking.price = event.params.price
    booking.status = 'BOOKED'
    booking.createdAt = event.block.timestamp
    booking.save()
}

export function handleSlotRevoked(event: SlotRevokedEvent): void {
    let id = event.params.tokenId.toString()
    let slot = TimeSlot.load(id)
    if (slot == null) return
    slot.isRevoked = true
    slot.isBooked = false
    slot.bookedBy = null
    slot.save()
}

export function handleSlotResold(event: SlotResoldEvent): void {
    let id = event.params.tokenId.toString()
    let slot = TimeSlot.load(id)
    if (slot == null) return
    slot.isBooked = true
    slot.bookedBy = event.params.to
    slot.price = event.params.price
    slot.save()
}

export function handleExpertProfileUpdated(event: ExpertProfileUpdatedEvent): void {
    let id = event.params.expert.toHex()
    let expert = ExpertProfile.load(id)
    if (expert == null) {
        expert = new ExpertProfile(id)
        expert.address = event.params.expert
        expert.totalSlots = BigInt.zero()
        expert.totalBookings = BigInt.zero()
        expert.rating = BigInt.zero()
        expert.reviewCount = BigInt.zero()
        expert.isActive = true
    }
    expert.name = event.params.name
    expert.profession = event.params.profession
    expert.description = ''
    expert.ens = ''
    expert.save()
}

export function handleSlotAutoRevoked(event: SlotAutoRevokedEvent): void {
    let id = event.params.tokenId.toString()
    let slot = TimeSlot.load(id)
    if (slot == null) return
    slot.isRevoked = true
    slot.isBooked = false
    slot.bookedBy = null
    slot.save()
}



