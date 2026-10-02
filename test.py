nums = [0, -1, 2, -3, 1]

from typing import List
   
def triplet_sum_brute_force(nums: List[int]) -> List[List[int]]:

    triplets = []
    nums.sort()
    
    for i in range(len(nums)):

        if nums[i] > 0:
            break

        if i > 0 and nums[i] == nums[i-1]:
            continue

        pairs = pair_sum_triplet(nums, i+1, -nums[i])
        for pair in pairs:
            triplets.append([nums[i]] + pair)

    return triplets


def pair_sum_triplet(nums: list[int], start: int, target:int) -> list[int]:
    pairs = []
    left, right = start, len(nums) - 1

    while left < right:
        curr_sum = nums[left] + nums[right]
        
        if curr_sum == target:
            pairs.append([nums[left], nums[right]])

            left += 1

            while left < right and nums[left] == nums[left- 1]:
                left += 1

        elif curr_sum < target:
            left += 1 
        else :
            right -= 1
    return pairs


print(triplet_sum_brute_force(nums))
